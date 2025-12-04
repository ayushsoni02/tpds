const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// This variable will hold the count in memory
let count = 0;

// API endpoint to get the current count
app.get('/count', (req, res) => {
  res.json({ count });
});

// API endpoint to update the count
app.post('/count', (req, res) => {
  count = req.body.count; // Update the count with the value from the request
  res.json({ count });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});