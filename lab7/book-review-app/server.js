const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 5001; // Different port to avoid conflicts

app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'book_reviews_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Get all reviews
app.get('/reviews', (req, res) => {
  db.query('SELECT * FROM reviews', (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(results);
  });
});

// Get reviews filtered by rating
app.get('/reviews/filter', (req, res) => {
  const { rating } = req.query;
  if (rating) {
    db.query('SELECT * FROM reviews WHERE rating = ?', [rating], (err, results) => {
      if (err) {
        console.error('Error filtering reviews:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(results);
    });
  } else {
    res.json([]);
  }
});

// Add a new review
app.post('/reviews', (req, res) => {
  const { title, author, rating, review_text } = req.body;
  if (!title || !author || !rating || !review_text || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'All fields are required, and rating must be between 1 and 5' });
    return;
  }
  const query = 'INSERT INTO reviews (title, author, rating, review_text) VALUES (?, ?, ?, ?)';
  db.query(query, [title, author, rating, review_text], (err, result) => {
    if (err) {
      console.error('Error adding review:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json({ id: result.insertId, title, author, rating, review_text });
  });
});

// Update a review
app.put('/reviews/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, rating, review_text } = req.body;
  if (!title || !author || !rating || !review_text || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'All fields are required, and rating must be between 1 and 5' });
    return;
  }
  const query = 'UPDATE reviews SET title = ?, author = ?, rating = ?, review_text = ? WHERE id = ?';
  db.query(query, [title, author, rating, review_text, id], (err) => {
    if (err) {
      console.error('Error updating review:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json({ id, title, author, rating, review_text });
  });
});

// Delete a review
app.delete('/reviews/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM reviews WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting review:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json({ message: 'Review deleted' });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});