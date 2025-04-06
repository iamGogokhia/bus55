const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const STOP_ID = "6000756"; // Cherry Hill Rd
  const API_KEY = process.env.WMATA_KEY;

  // Debug: Check that API key exists
  console.log("API Key Present:", !!API_KEY);

  const url = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}`;
  console.log("Request URL:", url.replace(API_KEY, "REDACTED"));

  try {
    const response = await fetch(url, {
      headers: { 'api_key': API_KEY }
    });

    // Debug: Check HTTP status
    console.log("HTTP Status:", response.status);

    const rawData = await response.text();
    console.log("Raw Response:", rawData);

    const data = JSON.parse(rawData);

    // Debug: Log predictions array
    console.log("Predictions:", data.Predictions);

    return {
      statusCode: 200,
      body: JSON.stringify({
        arrivals: data.Predictions || [],
        message: data.Predictions && data.Predictions.length > 0 
          ? "Bus arrivals retrieved."
          : "No buses arriving soon."
      })
    };
  } catch (error) {
    console.error("Full Error:", {
      message: error.message,
      stack: error.stack,
      url: url.replace(API_KEY, "REDACTED")
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch bus data",
        debug: {
          stopId: STOP_ID,
          apiKeyPresent: !!API_KEY
        }
      })
    };
  }
};
