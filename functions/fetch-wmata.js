const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const STOP_ID = "6000756"; // Cherry Hill Rd
  const TARGET_ROUTE = "55";
  const API_KEY = process.env.WMATA_KEY;

  const url = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}`;

  try {
    const response = await fetch(url, {
      headers: { 'api_key': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`WMATA API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.Predictions || data.Predictions.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          arrivals: [],
          message: "No arrival predictions found for this stop."
        })
      };
    }

    // Filter for Route 55 only
    const filteredArrivals = data.Predictions.filter(pred => pred.RouteID === TARGET_ROUTE);

    return {
      statusCode: 200,
      body: JSON.stringify({
        arrivals: filteredArrivals,
        message: filteredArrivals.length
          ? "Bus 55 predictions retrieved successfully."
          : "No Bus 55 predictions available right now."
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch or parse WMATA data.",
        detail: error.message,
        url: url.replace(API_KEY, "[REDACTED]")
      })
    };
  }
};
