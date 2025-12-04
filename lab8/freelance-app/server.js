const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 5002; // Different port to avoid conflicts
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key in production

app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'freelance_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
    if (err) {
      console.error('Error registering user:', err);
      return res.status(500).json({ error: 'Username already exists or database error' });
    }
    res.json({ message: 'User registered successfully' });
  });
});

// Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get all projects
app.get('/projects', (req, res) => {
  db.query('SELECT p.*, u.username FROM projects p JOIN users u ON p.user_id = u.id', (err, results) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Add a new project
app.post('/projects', authenticateToken, (req, res) => {
  const { title, description, budget } = req.body;
  if (!title || !description || !budget || budget <= 0) {
    return res.status(400).json({ error: 'All fields are required, and budget must be positive' });
  }
  db.query(
    'INSERT INTO projects (title, description, budget, user_id) VALUES (?, ?, ?, ?)',
    [title, description, budget, req.user.userId],
    (err, result) => {
      if (err) {
        console.error('Error adding project:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: result.insertId, title, description, budget, user_id: req.user.userId });
    }
  );
});

// Add a bid to a project
app.post('/bids', authenticateToken, (req, res) => {
  const { project_id, amount } = req.body;
  if (!project_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Project ID and positive bid amount are required' });
  }
  db.query(
    'INSERT INTO bids (project_id, user_id, amount) VALUES (?, ?, ?)',
    [project_id, req.user.userId, amount],
    (err, result) => {
      if (err) {
        console.error('Error adding bid:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: result.insertId, project_id, user_id: req.user.userId, amount });
    }
  );
});

// Get bids for a project
app.get('/bids/:project_id', (req, res) => {
  const { project_id } = req.params;
  db.query('SELECT b.*, u.username FROM bids b JOIN users u ON b.user_id = u.id WHERE b.project_id = ?', [project_id], (err, results) => {
    if (err) {
      console.error('Error fetching bids:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Delete a project
app.delete('/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM bids WHERE project_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting bids:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    db.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, req.user.userId], (err) => {
      if (err) {
        console.error('Error deleting project:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Project deleted' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});