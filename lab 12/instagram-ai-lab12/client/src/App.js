import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadPhoto from "./components/UploadPhoto";
import StoriesBar from "./components/StoriesBar";
import Navbar from "./components/Navbar";
import Feed from "./components/Feed";

function App() {
  // ✅ User authentication token (temporary dummy for now)
  const [token, setToken] = useState(null);

  // ✅ Dark / Light mode state
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark class on root <html> when mode changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ✅ TEMP: Simulate login to set dummy token
  useEffect(() => {
    // In a real app, replace with your actual login API
    const dummyToken = "demo-user-token-12345";
    setToken(dummyToken);
  }, []);

  return (
    <BrowserRouter>
      {/* Navbar always visible */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Routing structure */}
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500">
        <Routes>
          {/* Feed page */}
          <Route path="/" element={<Feed />} />

          {/* Upload page (protected) */}
          <Route
            path="/upload"
            element={
              token ? (
                <UploadPhoto token={token} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Stories page (protected) */}
          <Route
            path="/stories"
            element={
              token ? (
                <StoriesBar token={token} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
