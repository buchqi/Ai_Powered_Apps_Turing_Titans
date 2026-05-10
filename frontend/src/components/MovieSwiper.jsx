import React, { useState, useEffect, useCallback } from 'react';
import MovieCard from './MovieCard.jsx';
import { motion, AnimatePresence } from 'framer-motion';

function MovieSwiper({ isReady, isAnalyzing, movies, error, onLike, onReset }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [likedCount, setLikedCount] = useState(0);

  // Reset internal state when a new movie list arrives
  useEffect(() => {
    setCurrentIndex(0);
    setShowMatch(false);
    setLikedCount(0);
  }, [movies]);

  const currentMovie = movies[currentIndex];

  const handleAction = useCallback(
    (action) => {
      if (!currentMovie) return;
      if (action === 'like') {
        onLike?.(currentMovie);           // lift to App → Watchlist
        setLikedCount((n) => n + 1);
        setShowMatch(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentMovie, onLike]
  );

  const handleKeepSwiping = () => {
    setShowMatch(false);
    setCurrentIndex((c) => c + 1);
  };

  // Keyboard ← → navigation
  useEffect(() => {
    const onKey = (e) => {
      if (!isReady || !currentMovie || showMatch) return;
      if (e.key === 'ArrowRight') handleAction('like');
      if (e.key === 'ArrowLeft') handleAction('dislike');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isReady, currentMovie, showMatch, handleAction]);

  return (
    <section
      style={{ width: '100%', height: '100%', position: 'relative' }}
      aria-label="Movie recommendation swiper"
    >
      {/* Match overlay */}
      <AnimatePresence>
        {showMatch && currentMovie && (
          <motion.div
            key="match"
            className="match-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`It's a match — ${currentMovie.title}`}
          >
            <div style={{ textAlign: 'center', padding: '0 1.5rem' }}>
              <motion.h1
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
                style={{
                  fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                  color: 'var(--accent-gold)',
                  fontFamily: 'Playfair Display, serif',
                  marginBottom: '18px',
                }}
              >
                It's a Match!
              </motion.h1>

              <div
                style={{
                  width: '190px', height: '285px',
                  margin: '0 auto 18px',
                  borderRadius: '16px', overflow: 'hidden',
                  border: '3px solid var(--accent-gold)',
                  boxShadow: '0 0 50px rgba(245,200,66,0.25)',
                }}
              >
                <img
                  src={currentMovie.poster_url}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={currentMovie.title}
                />
              </div>

              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '6px' }}>
                {currentMovie.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '28px' }}>
                {currentMovie.year} · {currentMovie.genres?.join(' / ')}
              </p>

              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '20px' }}>
                Saved to your Watchlist ✓
              </p>

              <button
                className="btn-gold"
                onClick={handleKeepSwiping}
                autoFocus
              >
                Keep Swiping →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--accent-red)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            role="alert"
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>
              {error}
            </h2>
            <button className="btn-ghost" onClick={onReset}>Try Again</button>
          </motion.div>

        ) : isAnalyzing ? (
          <motion.div
            key="loading"
            style={{ textAlign: 'center', paddingTop: '120px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            aria-live="polite"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ fontSize: '2.8rem', color: 'var(--accent-gold)', marginBottom: '20px' }}
            >
              ✦
            </motion.div>
            <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Merging Profiles…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px' }}>
              Finding films both of you will love
            </p>
          </motion.div>

        ) : !isReady ? (
          <motion.div
            key="locked"
            className="movie-card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,15,30,0.5)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', opacity: 0.35, marginBottom: '14px' }}>🔒</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }}>Theater is Locked</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                Both users must complete their profile.
              </p>
            </div>
          </motion.div>

        ) : currentMovie ? (
          <>
            <MovieCard
              key={`${currentIndex}-${currentMovie.title}`}
              movie={currentMovie}
              onSwipe={handleAction}
            />
            <p className="keyboard-hint">← skip &nbsp;|&nbsp; like →</p>
          </>

        ) : (
          <motion.div
            key="end"
            style={{ textAlign: 'center', paddingTop: '90px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🎬</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '10px' }}>
              That's a Wrap!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
              {likedCount > 0
                ? `You matched on ${likedCount} film${likedCount > 1 ? 's' : ''}. Check your Watchlist.`
                : 'No matches this round.'}
            </p>
            <button className="btn-gold" onClick={onReset}>Start Over</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default MovieSwiper;