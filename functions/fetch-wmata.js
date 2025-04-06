const fetch = require('node-fetch');

exports.handler = async (event) => {
  const STOP_ID = "6000756"; // Updated stop ID
  const ROUTE_ID = "55"; 
  const API_KEY = process.env.WMATA_KEY;

  // Validate API key first
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "WMATA_KEY environment variable missing" })
    };
  }

  const url = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}`;

  try {
    const response = await fetch(url, {
      headers: { 'api_key': API_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`WMATA API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter and format predictions
    const predictions = (data.Predictions || [])
      .filter(pred => pred.RouteID === ROUTE_ID)
      .map(pred => ({
        Minutes: pred.Minutes,
        Direction: pred.DirectionText.replace(/ to /i, '→ '), // Improved formatting
        Vehicle: pred.VehicleID
      }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        stop: data.StopName || `Stop ${STOP_ID}`,
        predictions,
        metadata: {
          stopId: STOP_ID,
          routeId: ROUTE_ID,
          timestamp: new Date().toISOString()
        }
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch predictions",
        message: error.message,
        tip: "Verify stop ID 6000756 serves Route 55 at https://www.wmata.com/rider-tools/stop-search/"
      })
    };
  }
};
