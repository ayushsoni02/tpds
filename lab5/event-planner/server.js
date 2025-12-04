const express = require('express');
const cors = require('cors');
const app = express();
// Use port 5001 because macOS may have a system service bound to 5000 (AirPlay/Control Center)
const port = 5001;

// Use CORS middleware and also add an explicit handler so preflight (OPTIONS)
// requests always get the necessary headers. This helps when the frontend
// runs from a different port (e.g. http://localhost:3001).
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// In-memory array to store events
let events = [];

// Simple helper to normalize a date string to YYYY-MM-DD when possible
function normalizeDateToISO(dateStr) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // return original if invalid
  return d.toISOString().slice(0, 10);
}

// Get all events
app.get('/events', (req, res) => {
  console.log(`GET /events -> ${events.length} events`);
  res.json(events);
});

// Add a new event
app.post('/events', (req, res) => {
  // Normalize date (if possible) so frontend and server use consistent format
  const normalizedDate = normalizeDateToISO(req.body.date);
  const event = {
    id: events.length + 1,
    title: req.body.title,
    date: normalizedDate || req.body.date,
    description: req.body.description,
  };
  events.push(event);
  console.log('POST /events - added:', event);
  res.json(event);
});

// Filter events by date
app.get('/events/filter', (req, res) => {
  const { date } = req.query;
  if (date) {
    // Try to normalize both query and stored dates to ISO YYYY-MM-DD for comparison
    const normalizedQuery = normalizeDateToISO(date);
    const filteredEvents = events.filter(event => {
      const stored = normalizeDateToISO(event.date);
      return stored === normalizedQuery || event.date === date;
    });
    console.log(`GET /events/filter?date=${date} -> ${filteredEvents.length} events`);
    res.json(filteredEvents);
  } else {
    // If no date is provided, return all events
    console.log('GET /events/filter -> no date provided, returning all events');
    res.json(events);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});