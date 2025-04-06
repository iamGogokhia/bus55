const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const STOP_ID = "1001195"; // Use working stop from your test
  const ROUTE_ID = "55"; // Keep original target route
  const API_KEY = process.env.WMATA_KEY;

  const url = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}`;

  try {
    const response = await fetch(url, {
      headers: { 'api_key': API_KEY }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    // Filter for Route 55 specifically
    const bus55Predictions = data.Predictions?.filter(
      pred => pred.RouteID === ROUTE_ID
    ) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        stop: data.StopName,
        predictions: bus55Predictions
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "API Error",
        message: error.message
      })
    };
  }
};
