import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ darkMode, setDarkMode }) {
  return (
    <nav className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 shadow-lg sticky top-0">
      <h1 className="font-bold text-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
        InstaAI
      </h1>
      <div className="flex gap-4 items-center">
        <Link to="/">Feed</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/stories">Stories</Link>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
