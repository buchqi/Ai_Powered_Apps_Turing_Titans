import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import {
  getWatchlist,
  removeFromWatchlist,
} from '../api/recommendations.js';

// Served from frontend/public — works in all environments
const PLACEHOLDER_POSTER_URL = '/placeholder-poster.svg';

function Watchlist({ sessionId, onWatchlistChange }) {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);

  const getPrimaryGenre = (movie) => (
    Array.isArray(movie.genres) ? movie.genres[0] : movie.genres
  );
  const visibleMovies = sessionId ? movies : [];

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    getWatchlist(sessionId)
      .then((data) => {
        setMovies(data.watchlist ?? []);
        onWatchlistChange?.(data.watchlist ?? []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Could not load watchlist.');
      });
  }, [onWatchlistChange, sessionId]);

  const handleRemove = async (movie) => {
    if (!sessionId) return;

    try {
      const data = await removeFromWatchlist(sessionId, movie.id ?? movie.movie_id ?? movie.title);
      setMovies(data.watchlist ?? []);
      onWatchlistChange?.(data.watchlist ?? []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not remove this movie.');
    }
  };

  const handleClear = async () => {
    if (!sessionId || movies.length === 0) return;

    try {
      let current = movies;
      for (const movie of movies) {
        const data = await removeFromWatchlist(sessionId, movie.id ?? movie.movie_id ?? movie.title);
        current = data.watchlist ?? [];
      }
      setMovies(current);
      onWatchlistChange?.(current);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not clear watchlist. Please try again.');
    }
  };

  return (
    <main className="watchlist-page">
      <div className="watchlist-page__header">
        <h1 className="watchlist-page__title">
          Watchlist
          {visibleMovies.length > 0 && (
            <span
              style={{
                marginLeft: '14px',
                fontSize: '1rem',
                color: 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 400,
              }}
            >
              {visibleMovies.length} film{visibleMovies.length !== 1 ? 's' : ''}
            </span>
          )}
        </h1>

        {visibleMovies.length > 0 && (
          <button className="btn-ghost" onClick={handleClear} aria-label="Clear all watchlist items">
            Clear All
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--accent-red)', marginBottom: '24px' }} role="alert">
          {error}
        </p>
      )}

      {visibleMovies.length === 0 ? (
        <div className="watchlist-empty">
          <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.4 }}>Film</div>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.6rem',
              marginBottom: '12px',
            }}
          >
            Nothing saved yet
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Like a movie in the matcher and it'll appear here.
          </p>
          <Link to="/match" className="btn-gold">
            Start Matching
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {visibleMovies.map((movie, i) => (
            <Motion.div
              key={movie.id ?? movie.movie_id ?? movie.title}
              className="watchlist-card"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <img
                className="watchlist-card__poster"
                src={movie.poster_url || PLACEHOLDER_POSTER_URL}
                alt={movie.title}
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + PLACEHOLDER_POSTER_URL) {
                    e.currentTarget.src = PLACEHOLDER_POSTER_URL;
                  }
                }}
                loading="lazy"
              />
              <div className="watchlist-card__info">
                <p className="watchlist-card__title" title={movie.title}>
                  {movie.title}
                </p>
                <p className="watchlist-card__meta">
                  {movie.year}
                  {getPrimaryGenre(movie) && ` - ${getPrimaryGenre(movie)}`}
                </p>
                <button
                  className="watchlist-card__remove"
                  onClick={() => handleRemove(movie)}
                  aria-label={`Remove ${movie.title} from watchlist`}
                >
                  Remove
                </button>
              </div>
            </Motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Watchlist;