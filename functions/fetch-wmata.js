const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const STOP_ID = "6000756"; // Cherry Hill Rd
  const ROUTE_ID = "55";
  const API_KEY = process.env.WMATA_KEY; // Will set in Netlify later
  
  const url = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}&RouteID=${ROUTE_ID}`;

  try {
    const response = await fetch(url, {
      headers: { 'api_key': API_KEY }
    });
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch bus data" })
    };
  }
};
