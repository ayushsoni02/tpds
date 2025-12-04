const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGO_URL);
client.connect().then(() => {
  db = client.db('social_db');
  console.log("✅ MongoDB Connected");
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// 🧠 Simple fake login (for testing)
app.post('/login', (req, res) => {
  const user = { userId: '12345', username: 'demo_user' };
  const token = jwt.sign(user, process.env.JWT_SECRET);
  res.json({ token });
});

// 📸 Upload Photo
app.post('/upload-photo', authenticateToken, async (req, res) => {
  const { image_base64, caption, filter } = req.body;
  try {
    const result = await cloudinary.uploader.upload(image_base64, {
      folder: 'social_app',
      transformation: filter !== 'none' ? { effect: filter } : {},
    });

    const photo = await db.collection('photos').insertOne({
      user_id: req.user.userId,
      image_url: result.secure_url,
      caption,
      filter: filter !== 'none' ? filter : null,
      likes: [],
      comments: [],
      created_at: new Date(),
    });

    io.emit('new_photo', { photoId: photo.insertedId, caption, image_url: result.secure_url });
    res.json({ message: 'Photo uploaded successfully', url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err });
  }
});

// 🕒 Upload Story
app.post('/upload-story', authenticateToken, async (req, res) => {
  const { image_base64 } = req.body;
  try {
    const result = await cloudinary.uploader.upload(image_base64, { folder: 'stories' });
    await db.collection('stories').insertOne({
      user_id: req.user.userId,
      image_url: result.secure_url,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    io.emit('new_story', { user_id: req.user.userId, image_url: result.secure_url });
    res.json({ message: 'Story uploaded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Story upload failed', details: err });
  }
});

// 📖 Fetch Active Stories
app.get('/stories', authenticateToken, async (req, res) => {
  try {
    const stories = await db.collection('stories').find({
      expires_at: { $gt: new Date() },
    }).toArray();
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// ❤️ Like Photo
app.post('/like-photo', authenticateToken, async (req, res) => {
  const { photo_id } = req.body;
  await db.collection('photos').updateOne(
    { _id: new ObjectId(photo_id) },
    { $addToSet: { likes: req.user.userId } }
  );
  io.emit('photo_liked', { photo_id, user_id: req.user.userId });
  res.json({ message: 'Liked!' });
});

server.listen(process.env.PORT, () => console.log(`🚀 Backend running on port ${process.env.PORT}`));
