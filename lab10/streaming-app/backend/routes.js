const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const router = express.Router();

/* ===========================================
   ✅ Register
   =========================================== */
// ✅ Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    // ✅ Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE username=?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: '⚠️ Username already exists' });
    }

    // ✅ Hash password
    const hash = await bcrypt.hash(password, 10);

    // ✅ Insert new user (with empty preferences)
    await db.query(
      'INSERT INTO users (username, password, preferences) VALUES (?, ?, ?)',
      [username, hash, '']
    );

    res.json({ message: '✅ User registered successfully' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Server error during register', error: err.message });
  }
});


/* ===========================================
   ✅ Login
   =========================================== */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE username=?', [username]);
    if (!rows.length)
      return res.status(400).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid)
      return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.json({
      message: '✅ Login successful',
      token,
      user_id: rows[0].id,   // ✅ send user id too
      username: rows[0].username
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({
      message: 'Server error during login',
      error: err.message,
    });
  }
});
/* ===========================================
   ✅ Get all content
   =========================================== */
router.get('/content', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM content');
    res.json(rows);
  } catch (err) {
    console.error('CONTENT ERROR:', err);
    res.status(500).json({
      message: 'Error fetching content',
      error: err.message,
    });
  }
});

/* ===========================================
   ✅ Add to watchlist
   =========================================== */
router.post('/watchlist', async (req, res) => {
  try {
    const { user_id, content_id } = req.body;

    if (!user_id || !content_id)
      return res.status(400).json({ message: 'Missing user_id or content_id' });

    await db.query(
      'INSERT INTO watchlist (user_id, content_id) VALUES (?, ?)',
      [user_id, content_id]
    );

    res.json({ message: '✅ Added to watchlist!' });
  } catch (err) {
    console.error('WATCHLIST ERROR:', err);
    res.status(500).json({
      message: 'Error adding to watchlist',
      error: err.message,
    });
  }
});

/* ===========================================
   ✅ Get watchlist
   =========================================== */
router.get('/watchlist/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.query(
      `SELECT c.* 
       FROM watchlist w 
       JOIN content c ON w.content_id = c.id 
       WHERE w.user_id=?`,
      [user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('WATCHLIST FETCH ERROR:', err);
    res.status(500).json({
      message: 'Error fetching watchlist',
      error: err.message,
    });
  }
});

module.exports = router;
