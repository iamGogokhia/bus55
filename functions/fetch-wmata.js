const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const STOP_ID = "1001195"; // Georgia Ave & H St NW (always active)
  const API_KEY = process.env.WMATA_KEY;

  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const predictionsURL = `https://api.wmata.com/NextBusService.svc/json/jPredictions?StopID=${STOP_ID}`;
  const scheduleURL = `https://api.wmata.com/NextBusService.svc/json/jStopSchedule?StopID=${STOP_ID}&Date=${today}&Time=now`;

  try {
    // Fetch live predictions
    const [predictionsRes, scheduleRes] = await Promise.all([
      fetch(predictionsURL, { headers: { api_key: API_KEY } }),
      fetch(scheduleURL, { headers: { api_key: API_KEY } })
    ]);

    const predictionsData = await predictionsRes.json();
    const scheduleData = await scheduleRes.json();

    // Parse live predictions
    const liveArrivals = (predictionsData.Predictions || []).map(p => ({
      RouteID: p.RouteID,
      DirectionText: p.DirectionText,
      Min: p.Min,
      Type: "live"
    }));

    // Parse scheduled buses
    const scheduledArrivals = (scheduleData.ScheduleItems || []).map(s => ({
      RouteID: s.RouteID,
      DirectionText: s.DirectionText,
      Time: s.Time,
      Type: "scheduled"
    }));

    // Combine, avoiding duplicates
    const combined = [...liveArrivals];

    scheduledArrivals.forEach(sched => {
      const alreadyLive = liveArrivals.some(live => live.RouteID === sched.RouteID && live.DirectionText === sched.DirectionText);
      if (!alreadyLive) combined.push(sched);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        arrivals: combined.sort((a, b) => {
          const aMin = a.Min ?? parseInt(a.Time.split(":")[0]) * 60 + parseInt(a.Time.split(":")[1]);
          const bMin = b.Min ?? parseInt(b.Time.split(":")[0]) * 60 + parseInt(b.Time.split(":")[1]);
          return aMin - bMin;
        })
      })
    };
  } catch (err) {
    console.error("❌ Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch WMATA data", detail: err.message })
    };
  }
};
