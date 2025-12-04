import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Explore from './components/Explore';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  useEffect(() => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, [token, user]);

  return (
    <Router>
      <div className="App">
        {token && (
          <nav className="navbar">
            <Link to="/home">Home</Link>
            <Link to="/explore">Explore</Link>
            <Link to="/analytics">Analytics</Link>
            <Link to="/profile">Profile</Link>
          </nav>
        )}
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={token ? <Home token={token} /> : <Navigate to="/login" />} />
          <Route path="/explore" element={token ? <Explore token={token} /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={token ? <Analytics token={token} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={token ? <Profile user={user} setUser={setUser} token={token} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
