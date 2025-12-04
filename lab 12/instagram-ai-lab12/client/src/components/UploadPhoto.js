// src/components/UploadPhoto.js
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

function UploadPhoto({ token }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('none');
  const [filteredPreview, setFilteredPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const filters = ['none', 'vintage', 'sunset', 'bw'];

  // When a user selects an image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setPreview(reader.result);
      setFilteredPreview(null);
    };
    reader.readAsDataURL(file);
  };

  // Apply AI Filter (via Flask backend)
  const applyFilter = async (selectedFilter) => {
    if (!image || selectedFilter === 'none') {
      setFilteredPreview(preview);
      setFilter('none');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5006/apply-filter', {
        image_url: preview,
        filter: selectedFilter,
      });
      setFilteredPreview(res.data.filtered_image);
      setFilter(selectedFilter);
    } catch (err) {
      alert('❌ Filter failed. Make sure AI filter service is running!');
    } finally {
      setLoading(false);
    }
  };

  // Upload to backend → Cloudinary → MongoDB
  const handleUpload = async () => {
    if (!preview) return alert('Please select an image first!');
    try {
      setLoading(true);
      const res = await axios.post(
        'http://localhost:5005/upload-photo',
        {
          image_base64: filteredPreview || preview,
          caption,
          filter,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('✅ Photo posted successfully!');
      setImage(null);
      setPreview(null);
      setFilteredPreview(null);
      setCaption('');
      console.log('Photo URL:', res.data.url);
    } catch (err) {
      alert('❌ Upload failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">📸 Share a Photo</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4 w-full text-sm text-gray-700 dark:text-gray-300"
      />

      {preview && (
        <div className="space-y-4">
          <img
            src={filteredPreview || preview}
            alt="Preview"
            className="w-full rounded-lg shadow-md"
          />

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => applyFilter(f)}
                disabled={loading}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Caption Input */}
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            {loading ? 'Uploading...' : 'Post to Feed'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default UploadPhoto;
