import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Feed() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5005/photos')
      .then(res => setPhotos(res.data))
      .catch(() => console.log('Error loading feed'));
  }, []);

  return (
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <div key={photo._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
          <img src={photo.image_url} alt="post" className="rounded-lg mb-3" />
          <p className="text-sm text-gray-700 dark:text-gray-300">{photo.caption}</p>
        </div>
      ))}
    </div>
  );
}
