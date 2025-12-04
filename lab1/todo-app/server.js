const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// In-memory array to store todos
let todos = [];

// Get all todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// Add a new todo
app.post('/todos', (req, res) => {
  const todo = { id: todos.length + 1, text: req.body.text };
  todos.push(todo);
  res.json(todo);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});