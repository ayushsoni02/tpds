import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5005');

function Home({ token }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await axios.get('http://localhost:5005/posts');
        setPosts(res.data.posts);
      } catch {
        setError('Failed to load posts');
      }
    };
    loadPosts();

    socket.on('new_post', (post) => setPosts((prev) => [post, ...prev]));
    return () => socket.off('new_post');
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5005/posts', { content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    }
  };

  return (
    <div className="home">
      <h2>Feed</h2>
      <form onSubmit={handlePost} className="post-form">
        <textarea placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} />
        <button type="submit">Post</button>
      </form>
      {posts.map((p) => (
        <div key={p._id} className="post-card">
          <p>{p.content}</p>
          <p><strong>Sentiment:</strong> {p.sentiment}</p>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
      <button onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
    </div>
  );
}

export default Home;
