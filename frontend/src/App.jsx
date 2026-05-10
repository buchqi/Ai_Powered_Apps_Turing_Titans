import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar.jsx';
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Watchlist from './pages/Watchlist.jsx';
import About from './pages/About.jsx';

function App() {
  const [likedMovies, setLikedMovies] = useState([]);

  const handleLike = (movie) => {
    setLikedMovies((prev) =>
      prev.find((m) => m.title === movie.title) ? prev : [...prev, movie]
    );
  };

  return (
    <BrowserRouter>
      <Navbar likedCount={likedMovies.length} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/match" element={<Home onLike={handleLike} />} />
        <Route
          path="/watchlist"
          element={
            <Watchlist
              movies={likedMovies}
              onClear={() => setLikedMovies([])}
            />
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;