const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'recipes_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Get all recipes
app.get('/recipes', (req, res) => {
  db.query('SELECT * FROM recipes', (err, results) => {
    if (err) {
      console.error('Error fetching recipes:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });
});

// Add a new recipe
app.post('/recipes', (req, res) => {
  const { name, ingredients, instructions } = req.body;
  if (!name || !ingredients || !instructions) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  const query = 'INSERT INTO recipes (name, ingredients, instructions) VALUES (?, ?, ?)';
  db.query(query, [name, ingredients, instructions], (err, result) => {
    if (err) {
      console.error('Error adding recipe:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json({ id: result.insertId, name, ingredients, instructions });
  });
});

// Delete a recipe
app.delete('/recipes/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM recipes WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting recipe:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json({ message: 'Recipe deleted' });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});