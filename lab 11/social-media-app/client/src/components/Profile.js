import React, { useState } from 'react';

function Profile({ user, setUser, token }) {
  const [bio, setBio] = useState(user.bio || '');

  const handleUpdate = () => {
    setUser({ ...user, bio });
    alert('Bio updated (local only)');
  };

  return (
    <div className="profile">
      <h2>Profile</h2>
      <p><strong>Username:</strong> {user.username}</p>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      <button onClick={handleUpdate}>Update Bio</button>
    </div>
  );
}

export default Profile;
