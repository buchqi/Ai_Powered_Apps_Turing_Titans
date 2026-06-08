import React, { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Watchlist from './pages/Watchlist.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Account from './pages/Account.jsx';
import Settings from './pages/Settings.jsx';

const SESSION_STORAGE_KEY = 'film_adviser_session_id';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const [sessionId, setSessionId] = useState(
    () => sessionStorage.getItem(SESSION_STORAGE_KEY)
  );
  const [watchlistCount, setWatchlistCount] = useState(0);

  const handleSessionChange = useCallback((next) => {
    setSessionId(next);
    if (next) sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    else sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const handleWatchlistChange = useCallback((movies) => {
    setWatchlistCount(movies.length);
  }, []);

  return (
    <>
      <Navbar likedCount={watchlistCount} />
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />
        <Route path="/about"     element={<About />} />
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
        <Route
          path="/account"
          element={<ProtectedRoute><Account /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><Settings /></ProtectedRoute>}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
