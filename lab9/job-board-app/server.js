const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs'); // ✅ fixed
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const port = 5001;
const JWT_SECRET = 'your_super_secret_jwt_key_change_this'; // Change this!

app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Change this!
  database: 'job_board_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password, skills } = req.body;
  if (!username || !password || !skills) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, password, skills) VALUES (?, ?, ?)',
      [username, hashedPassword, skills],
      (err) => {
        if (err) {
          console.error('Error registering user:', err);
          return res.status(500).json({ error: 'Username already exists or database error' });
        }
        res.json({ message: 'User registered successfully' });
      }
    );
  } catch (error) {
    console.error('Hashing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username, skills: user.skills, userId: user.id });
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

// Get all jobs with pagination and search
app.get('/jobs', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT j.*, u.username 
    FROM jobs j 
    JOIN users u ON j.user_id = u.id 
    WHERE j.title LIKE ? OR j.description LIKE ? 
    LIMIT ? OFFSET ?
  `;

  db.query(query, [`%${search}%`, `%${search}%`, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('Error fetching jobs:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    db.query(
      'SELECT COUNT(*) as total FROM jobs WHERE title LIKE ? OR description LIKE ?',
      [`%${search}%`, `%${search}%`],
      (err, countResult) => {
        if (err) {
          console.error('Error counting jobs:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ jobs: results, total: countResult[0].total });
      }
    );
  });
});

// Get AI-recommended jobs
app.get('/jobs/recommended', authenticateToken, async (req, res) => {
  db.query('SELECT skills FROM users WHERE id = ?', [req.user.userId], async (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(500).json({ error: 'User not found' });
    }

    const userSkills = userResult[0].skills;

    db.query('SELECT id, skills_required FROM jobs', async (err, jobs) => {
      if (err) {
        console.error('Error fetching jobs:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (jobs.length === 0) {
        return res.json([]);
      }

      try {
        const response = await axios.post('http://localhost:5003/recommend', {
          user_skills: userSkills,
          jobs
        });

        const recommendedJobIds = response.data;
        if (recommendedJobIds.length === 0) {
          return res.json([]);
        }

        db.query(
          'SELECT j.*, u.username FROM jobs j JOIN users u ON j.user_id = u.id WHERE j.id IN (?)',
          [recommendedJobIds],
          (err, results) => {
            if (err) {
              console.error('Error fetching recommended jobs:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
          }
        );
      } catch (err) {
        console.error('Error with AI recommendation:', err);
        res.status(500).json({ error: 'AI recommendation error' });
      }
    });
  });
});

// Add a new job
app.post('/jobs', authenticateToken, (req, res) => {
  const { title, description, skills_required } = req.body;
  if (!title || !description || !skills_required) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query(
    'INSERT INTO jobs (title, description, skills_required, user_id) VALUES (?, ?, ?, ?)',
    [title, description, skills_required, req.user.userId],
    (err, result) => {
      if (err) {
        console.error('Error adding job:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        id: result.insertId,
        title,
        description,
        skills_required,
        user_id: req.user.userId
      });
    }
  );
});

// Apply to a job
app.post('/applications', authenticateToken, (req, res) => {
  const { job_id } = req.body;
  if (!job_id) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  db.query('INSERT INTO applications (job_id, user_id) VALUES (?, ?)',
    [job_id, req.user.userId], (err, result) => {
      if (err) {
        console.error('Error applying to job:', err);
        return res.status(500).json({ error: 'Database error or already applied' });
      }
      res.json({ id: result.insertId, job_id, user_id: req.user.userId });
    });
});

// Get applications for a job
app.get('/applications/:job_id', authenticateToken, (req, res) => {
  const { job_id } = req.params;

  db.query(
    'SELECT a.*, u.username FROM applications a JOIN users u ON a.user_id = u.id WHERE a.job_id = ?',
    [job_id],
    (err, results) => {
      if (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
});

// Delete a job
app.delete('/jobs/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM applications WHERE job_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting applications:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    db.query('DELETE FROM jobs WHERE id = ? AND user_id = ?', [id, req.user.userId], (err) => {
      if (err) {
        console.error('Error deleting job:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Job deleted' });
    });
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
