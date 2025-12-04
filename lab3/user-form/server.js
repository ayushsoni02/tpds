const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// In-memory array to store users
let users = [];

// Get all users
app.get('/users', (req, res) => {
  res.json(users);
});

// Add a new user
app.post('/users', (req, res) => {
  const user = { id: users.length + 1, name: req.body.name, email: req.body.email };
  users.push(user);
  res.json(user);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});