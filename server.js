const express = require("express");
const basicAuth = require("basic-auth");

const app = express();
app.use(express.json());

/* =========================
   SETTINGS
========================= */
const ADMIN_USER = "owner";
const ADMIN_PASS = "1234"; // change this password
const DATA_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/* =========================
   TEMP STORAGE
========================= */
let records = [];

/* Auto remove old records every minute */
setInterval(() => {
  const now = Date.now();
  records = records.filter(r => now - r.time < DATA_EXPIRY);
}, 60 * 1000);

/* =========================
   MAIN PAGE
========================= */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Consent GPS</title>
  <style>
    body { font-family: Arial; text-align:center; margin-top:50px; }
    button { padding:10px 20px; margin:10px; cursor:pointer; }
  </style>
</head>
<body>

<h2>Privacy Notice</h2>
<p>This website will request your exact GPS location.</p>
<p>Location is collected ONLY after you click Accept and allow browser permission.</p>

<button onclick="accept()">Accept</button>
<button onclick="decline()">Decline</button>

<script>
function accept() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function(position) {
      fetch("/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      }).then(() => {
        alert("Location shared successfully.");
      });
    },
    function() {
      alert("Permission denied.");
    }
  );
}

function decline() {
  alert("You declined. No data collected.");
}
</script>

</body>
</html>
  `);
});

/* =========================
   COLLECT ROUTE
========================= */
app.post("/collect", (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).send("Invalid data");
  }

  records.push({
    latitude,
    longitude,
    time: Date.now(),
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress
  });

  res.send("Data stored");
});

/* =========================
   ADMIN LOGIN
========================= */
function authenticate(req, res, next) {
  const user = basicAuth(req);

  if (!user || user.name !== ADMIN_USER || user.pass !== ADMIN_PASS) {
    res.set("WWW-Authenticate", 'Basic realm="Admin Area"');
    return res.status(401).send("Access denied");
  }

  next();
}

/* =========================
   ADMIN PAGE
========================= */
app.get("/admin", authenticate, (req, res) => {
  let html = `
  <h2>Admin Panel (Last 24 Hours)</h2>
  <table border="1" cellpadding="8">
  <tr>
    <th>Time</th>
    <th>Latitude</th>
    <th>Longitude</th>
    <th>IP</th>
  </tr>
  `;

  records.forEach(r => {
    html += `
    <tr>
      <td>${new Date(r.time).toLocaleString()}</td>
      <td>${r.latitude}</td>
      <td>${r.longitude}</td>
      <td>${r.ip}</td>
    </tr>
    `;
  });

  html += "</table>";

  res.send(html);
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
