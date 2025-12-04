import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Explore({ token }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5005/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch {
        setError('Failed to load users');
      }
    };
    loadUsers();
  }, [token]);

  const handleFollow = async (id) => {
    try {
      await axios.post('http://localhost:5005/follow', { followee_id: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Followed!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to follow user');
    }
  };

  return (
    <div className="explore">
      <h2>Explore Users</h2>
      {users.map(u => (
        <div key={u._id} className="user-card">
          <h4>{u.username}</h4>
          <p>{u.bio}</p>
          <button onClick={() => handleFollow(u._id)}>Follow</button>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Explore;
