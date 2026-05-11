import React, { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Watchlist from './pages/Watchlist.jsx';
import About from './pages/About.jsx';

const SESSION_STORAGE_KEY = 'film_adviser_session_id';

function App() {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_STORAGE_KEY));
  const [watchlistCount, setWatchlistCount] = useState(0);

  const handleSessionChange = useCallback((nextSessionId) => {
    setSessionId(nextSessionId);
    if (nextSessionId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const handleWatchlistChange = useCallback((movies) => {
    setWatchlistCount(movies.length);
  }, []);

  return (
    <BrowserRouter>
      <Navbar likedCount={watchlistCount} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/match"
          element={
            <Home
              onSessionChange={handleSessionChange}
              onWatchlistChange={handleWatchlistChange}
            />
          }
        />
        <Route
          path="/watchlist"
          element={
            <Watchlist
              sessionId={sessionId}
              onWatchlistChange={handleWatchlistChange}
            />
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
