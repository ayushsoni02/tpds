// src/components/StoriesBar.js
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

function StoriesBar({ token }) {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios
      .get('http://localhost:5005/stories', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStories(res.data))
      .catch((err) => console.error('Failed to fetch stories', err));
  }, [token]);

  return (
    <motion.div
      className="flex gap-4 p-4 overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {stories.length === 0 ? (
        <p className="text-center w-full text-gray-500 dark:text-gray-400">
          No active stories
        </p>
      ) : (
        stories.map((story, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-r from-pink-500 to-purple-500">
              <img
                src={story.image_url}
                alt="story"
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            </div>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
              Story
            </p>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

export default StoriesBar;
