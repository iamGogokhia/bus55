const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const STOP_ID = "6000756"; // Cherry Hill Rd
  const ROUTE_ID = "55";
  const API_KEY = process.env.WMATA_KEY;
  
  // Debug: Verify environment variable
  console.log("API Key Present:", !!API_KEY);
  
  const url = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}&RouteID=${ROUTE_ID}`;
  console.log("Request URL:", url.replace(API_KEY, "REDACTED"));

  try {
    const response = await fetch(url, {
      headers: { 'api_key': API_KEY }
    });
    
    // Debug: Check HTTP status
    console.log("HTTP Status:", response.status);
    
    // Debug: Log raw response text
    const rawData = await response.text();
    console.log("Raw Response:", rawData);
    
    const data = JSON.parse(rawData);
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    // Debug: Full error logging
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
          routeId: ROUTE_ID,
          apiKeyPresent: !!API_KEY
        }
      })
    };
  }
};
