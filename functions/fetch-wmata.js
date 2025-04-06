const fetch = require('node-fetch');

// Cache configuration
let cache = {
    timestamp: 0,
    data: null,
    routeId: null,
    stopId: null
};

exports.handler = async (event) => {
    const { 
        stopId = "1001195",  // Default stop ID (7th St & Massachusetts Ave NW)
        routeId = "70"       // Updated default route ID (Route 70)
    } = event.queryStringParameters;

    const API_KEY = process.env.WMATA_KEY;

    // Validate API key
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Configuration Error",
                message: "WMATA API key missing in environment variables"
            })
        };
    }

    // Cache validation check
    const now = Date.now();
    if (cache.stopId === stopId && 
        cache.routeId === routeId && 
        now - cache.timestamp < 30000) {
        return {
            statusCode: 200,
            body: JSON.stringify(cache.data)
        };
    }

    // API request setup
    const apiUrl = new URL('https://api.wmata.com/NextBusService.svc/json/jPredictions');
    apiUrl.searchParams.set('StopID', stopId);

    try {
        // Fetch live data
        const response = await fetch(apiUrl.toString(), {
            headers: { 'api_key': API_KEY }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${await response.text()}`);
        }

        const result = await response.json();
        
        // Process predictions
        const predictions = (result.Predictions || [])
            .filter(p => p.RouteID === routeId)
            .map(p => ({
                Minutes: p.Minutes,
                Direction: p.DirectionText.replace(/^\w+\s+to\s+/i, ''), // Clean direction text
                Vehicle: p.VehicleID
            }));

        // Update cache with fresh data
        cache = {
            timestamp: now,
            data: {
                stop: result.StopName || `Stop ${stopId}`,
                predictions,
                metadata: {
                    stopId,
                    routeId,
                    timestamp: new Date().toISOString(),
                    apiStatus: "live"
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
        // Fallback to cache if available
        if (cache.data) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    ...cache.data,
                    metadata: {
                        ...cache.data.metadata,
                        apiStatus: "cached",
                        error: error.message
                    }
                })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Service Unavailable",
                message: error.message
            })
        };
    }
};
