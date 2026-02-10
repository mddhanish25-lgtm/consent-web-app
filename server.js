const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// In-memory storage (for demo)
let gpsDB = [];

app.use(bodyParser.json());
app.use(express.static(".")); // serve index.html & consent.js

// Endpoint to store GPS
app.post("/store-gps", (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body;

  const record = {
    latitude,
    longitude,
    accuracy,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };

  gpsDB.push(record);
  console.log("Stored GPS record:", record);

  res.json({ status: "stored" });
});

// Auto-delete expired GPS every hour
setInterval(() => {
  const now = Date.now();
  gpsDB = gpsDB.filter(record => record.expiresAt > now);
  console.log("Expired GPS deleted, remaining:", gpsDB.length);
}, 60 * 60 * 1000);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on https://gps-consent-demo.${process.env.REPL_OWNER}.repl.co`));
