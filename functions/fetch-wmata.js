const fetch = require('node-fetch');

// Simple in-memory cache with 30-second expiration
let cache = {
    timestamp: 0,
    data: null,
    routeId: null,
    stopId: null
};

exports.handler = async (event) => {
    const { 
        stopId = "1001195",  // Default stop ID
        routeId = "55"       // Default route ID
    } = event.queryStringParameters;

    const API_KEY = process.env.WMATA_KEY;

    // Validate environment configuration
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Server Configuration Error",
                message: "WMATA API key not configured"
            })
        };
    }

    // Check cache validity (same parameters and within 30 seconds)
    const now = Date.now();
    if (cache.stopId === stopId && 
        cache.routeId === routeId && 
        now - cache.timestamp < 30000) {
        return {
            statusCode: 200,
            body: JSON.stringify(cache.data)
        };
    }

    // Build API URL
    const apiUrl = new URL('https://api.wmata.com/NextBusService.svc/json/jPredictions');
    apiUrl.searchParams.set('StopID', stopId);

    try {
        // Fetch real-time data from WMATA API
        const response = await fetch(apiUrl.toString(), {
            headers: { 'api_key': API_KEY }
        });

        // Handle HTTP errors
        if (!response.ok) {
            throw new Error(`WMATA API Error: ${response.status} ${response.statusText}`);
        }

        // Parse and filter results
        const result = await response.json();
        const predictions = (result.Predictions || [])
            .filter(p => p.RouteID === routeId)
            .map(p => ({
                Minutes: p.Minutes,
                DirectionText: p.DirectionText,
                VehicleID: p.VehicleID
            }));

        // Update cache
        cache = {
            timestamp: now,
            data: {
                stop: result.StopName || 'Unknown Stop',
                predictions,
                metadata: {
                    stopId,
                    routeId,
                    timestamp: new Date().toISOString()
                }
            },
            routeId,
            stopId
        };

        return {
            statusCode: 200,
            body: JSON.stringify(cache.data)
        };

    } catch (error) {
        // Return cached data if available during errors
        if (cache.data) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    ...cache.data,
                    error: {
                        message: "Showing cached data due to API failure",
                        originalError: error.message
                    }
                })
            };
        }

        // Fallback error response
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Service Temporarily Unavailable",
                message: error.message
            })
        };
    }
};
