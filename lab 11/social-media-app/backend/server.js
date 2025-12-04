const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');
const http = require('http');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const port = process.env.PORT || 5005;
const JWT_SECRET = process.env.JWT_SECRET;
const mongoUrl = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
const client = new MongoClient(mongoUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('gg'); // your database name
    console.log('✅ Connected to MongoDB Atlas (database: gg)');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}
connectDB();

// ✅ Socket.IO for live updates
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// ✅ Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ✅ Register new user
app.post('/register', async (req, res) => {
  const { username, password, bio } = req.body;
  if (!username || !password || !bio)
    return res.status(400).json({ error: 'All fields required' });

  try {
    const existing = await db.collection('users').findOne({ username });
    if (existing)
      return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').insertOne({
      username,
      password: hashedPassword,
      bio,
    });

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ✅ Get all users (for Explore)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await db
      .collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// ✅ Create Post
app.post('/posts', authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  try {
    // Analyze sentiment via Flask AI
    const sentimentResponse = await axios.post(
      'http://localhost:5006/sentiment',
      { content }
    );

    const result = await db.collection('posts').insertOne({
      user_id: req.user.userId,
      content,
      created_at: new Date(),
      sentiment: sentimentResponse.data.sentiment,
    });

    io.emit('new_post', {
      _id: result.insertedId,
      content,
      sentiment: sentimentResponse.data.sentiment,
    });

    res.json({ message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ✅ Get all Posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await db
      .collection('posts')
      .find()
      .sort({ created_at: -1 })
      .toArray();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// ✅ Follow another user
app.post('/follow', authenticateToken, async (req, res) => {
  const { followee_id } = req.body;
  if (!followee_id)
    return res.status(400).json({ error: 'Followee ID required' });

  try {
    await db.collection('follows').insertOne({
      follower_id: new ObjectId(req.user.userId),
      followee_id: new ObjectId(followee_id),
    });

    io.emit('new_follow', {
      follower_id: req.user.userId,
      followee_id,
    });

    res.json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ Like a post
app.post('/like', authenticateToken, async (req, res) => {
  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: 'Post ID required' });

  try {
    await db.collection('likes').insertOne({
      user_id: new ObjectId(req.user.userId),
      post_id: new ObjectId(post_id),
    });

    io.emit('new_like', { post_id, user_id: req.user.userId });
    res.json({ message: 'Post liked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ Analytics
app.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const postCount = await db
      .collection('posts')
      .countDocuments({ user_id: req.user.userId });
    const followerCount = await db
      .collection('follows')
      .countDocuments({ followee_id: req.user.userId });
    const likeCount = await db.collection('likes').countDocuments({
      post_id: {
        $in: (
          await db
            .collection('posts')
            .find({ user_id: req.user.userId })
            .toArray()
        ).map((p) => p._id),
      },
    });

    res.json({ postCount, followerCount, likeCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// ✅ Start Server
server.listen(port, () =>
  console.log(`🚀 Server running at http://localhost:${port}`)
);
