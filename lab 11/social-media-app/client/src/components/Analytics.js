import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const socket = io('http://localhost:5005');

function Analytics({ token }) {
  const [data, setData] = useState({ postCount: 0, followerCount: 0, likeCount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('http://localhost:5005/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    };
    fetchData();

    socket.on('new_like', fetchData);
    socket.on('new_follow', fetchData);

    return () => {
      socket.off('new_like');
      socket.off('new_follow');
    };
  }, [token]);

  const chartData = {
    labels: ['Posts', 'Followers', 'Likes'],
    datasets: [
      {
        label: 'User Analytics',
        data: [data.postCount, data.followerCount, data.likeCount],
        borderColor: '#1DA1F2',
        backgroundColor: 'rgba(29, 161, 242, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div className="analytics">
      <h2>Analytics</h2>
      <Line data={chartData} />
    </div>
  );
}

export default Analytics;
