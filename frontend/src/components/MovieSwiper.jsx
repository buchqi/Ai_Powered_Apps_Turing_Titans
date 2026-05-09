import React, { useState } from "react";
import MovieCard from "./MovieCard.jsx";
import { motion, AnimatePresence } from "framer-motion";

function MovieSwiper({ isReady, isAnalyzing, movies }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const currentMovie = movies[currentIndex];

  const handleAction = (action) => {
    if (action === 'like') setShowMatch(true);
    else setCurrentIndex((prev) => prev + 1);
  };

  return (
    <section className="swiper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AnimatePresence mode="wait">
        {showMatch && (
          <motion.div 
            key="match"
            className="match-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
             <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3.5rem', color: 'var(--accent-gold)', fontFamily: 'Playfair Display' }}>It's a Match!</h1>
                <div style={{ width: '220px', height: '330px', margin: '20px auto', borderRadius: '16px', overflow: 'hidden', border: '3px solid var(--accent-gold)' }}>
                  <img src={currentMovie?.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Match" />
                </div>
                <h2 style={{ fontFamily: 'Playfair Display', marginBottom: '20px' }}>{currentMovie?.title}</h2>
                <button 
                  onClick={() => { setShowMatch(false); setCurrentIndex(c => c+1); }}
                  style={{ background: 'var(--accent-gold)', color: '#000', padding: '12px 30px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                  Keep Swiping
                </button>
             </div>
          </motion.div>
        )}

        {isAnalyzing ? (
          <motion.div key="loading" style={{ textAlign: 'center', paddingTop: '120px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '20px' }}>✧</motion.div>
            <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Merging Profiles...</h2>
          </motion.div>
        ) : !isReady ? (
          <motion.div key="locked" className="movie-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
             <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '15px' }}>🔒</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--text-main)' }}>Theater is Locked</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                  Please complete the active profile.
                </p>
             </div>
          </motion.div>
        ) : currentMovie ? (
          <MovieCard key={currentIndex} movie={currentMovie} onSwipe={handleAction} />
        ) : (
          <div key="end" style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>No more movies found.</div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default MovieSwiper;