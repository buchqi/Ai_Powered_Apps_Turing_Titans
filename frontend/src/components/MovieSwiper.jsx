import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import MovieCard from './MovieCard.jsx';

// Served from frontend/public — works in all environments
const PLACEHOLDER_POSTER_URL = '/placeholder-poster.svg';

function MovieSwiper({
  isReady,
  isAnalyzing,
  isLoadingMore,
  movies,
  canLoadMore,
  error,
  onLike,
  onDislike,
  onNearEnd,
  onReset,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedMovie, setMatchedMovie] = useState(null);
  const [likedCount, setLikedCount] = useState(0);

  const currentMovie = movies[currentIndex];
  const matchedGenres = Array.isArray(matchedMovie?.genres)
    ? matchedMovie.genres.join(' / ')
    : matchedMovie?.genres;

  useEffect(() => {
    const remainingCards = movies.length - currentIndex;
    if (isReady && canLoadMore && !isLoadingMore && remainingCards <= 2) {
      onNearEnd?.();
    }
  }, [canLoadMore, currentIndex, isLoadingMore, isReady, movies.length, onNearEnd]);

  const handleAction = useCallback(
    (action) => {
      if (!currentMovie) return;

      if (action === 'like') {
        onLike?.(currentMovie);
        setLikedCount((n) => n + 1);
        setMatchedMovie(currentMovie);
        setShowMatch(true);
      } else {
        onDislike?.(currentMovie);
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [currentMovie, onDislike, onLike]
  );

  const handleKeepSwiping = () => {
    setShowMatch(false);
    setMatchedMovie(null);
  };

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
      <AnimatePresence>
        {showMatch && matchedMovie && (
          <Motion.div
            key="match"
            className="match-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`It's a match - ${matchedMovie.title}`}
          >
            <div style={{ textAlign: 'center', padding: '0 1.5rem' }}>
              <Motion.h1
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
              </Motion.h1>

              <div
                style={{
                  width: '190px',
                  height: '285px',
                  margin: '0 auto 18px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '3px solid var(--accent-gold)',
                  boxShadow: '0 0 50px rgba(245,200,66,0.25)',
                }}
              >
                <img
                  src={matchedMovie.poster_url || PLACEHOLDER_POSTER_URL}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={matchedMovie.title}
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + PLACEHOLDER_POSTER_URL) {
                      e.currentTarget.src = PLACEHOLDER_POSTER_URL;
                    }
                  }}
                />
              </div>

              <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '6px' }}>
                {matchedMovie.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '28px' }}>
                {matchedMovie.year} {matchedGenres && `- ${matchedGenres}`}
              </p>

              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '20px' }}>
                Saved to your Watchlist
              </p>

              <button className="btn-gold" onClick={handleKeepSwiping} autoFocus>
                Keep Swiping
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error ? (
          <Motion.div
            key="error"
            style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--accent-red)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="alert"
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>!</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>
              {error}
            </h2>
            <button className="btn-ghost" onClick={onReset}>Try Again</button>
          </Motion.div>
        ) : isAnalyzing ? (
          <Motion.div
            key="loading"
            style={{ textAlign: 'center', paddingTop: '120px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-live="polite"
          >
            <Motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ fontSize: '2.8rem', color: 'var(--accent-gold)', marginBottom: '20px' }}
            >
              *
            </Motion.div>
            <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Merging Profiles...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px' }}>
              Finding films both of you will love
            </p>
          </Motion.div>
        ) : !isReady ? (
          <Motion.div
            key="locked"
            className="movie-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,15,30,0.5)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', opacity: 0.35, marginBottom: '14px' }}>Locked</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif' }}>Theater is Locked</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                Both users must complete their profile.
              </p>
            </div>
          </Motion.div>
        ) : currentMovie ? (
          <>
            <MovieCard
              key={`${currentIndex}-${currentMovie.id ?? currentMovie.movie_id ?? currentMovie.title}`}
              movie={currentMovie}
              onSwipe={handleAction}
            />
            <p className="keyboard-hint">skip left | like right</p>
          </>
        ) : isLoadingMore ? (
          <Motion.div
            key="loading-more"
            style={{ textAlign: 'center', paddingTop: '120px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-live="polite"
          >
            <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Loading More Films...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px' }}>
              Pulling the next batch from your session.
            </p>
          </Motion.div>
        ) : (
          <Motion.div
            key="end"
            style={{ textAlign: 'center', paddingTop: '90px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>End</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '10px' }}>
              That's a Wrap!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
              {likedCount > 0
                ? `You matched on ${likedCount} film${likedCount > 1 ? 's' : ''}. Check your Watchlist.`
                : movies.length === 0
                ? 'No movies matched both profiles. Try a different combination.'
                : 'No matches this round.'}
            </p>
            <button className="btn-gold" onClick={onReset}>Start Over</button>
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default MovieSwiper;