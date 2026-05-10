import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Watchlist({ movies, onClear }) {
  return (
    <main className="watchlist-page">
      <div className="watchlist-page__header">
        <h1 className="watchlist-page__title">
          Watchlist
          {movies.length > 0 && (
            <span
              style={{
                marginLeft: '14px',
                fontSize: '1rem',
                color: 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 400,
              }}
            >
              {movies.length} film{movies.length !== 1 ? 's' : ''}
            </span>
          )}
        </h1>

        {movies.length > 0 && (
          <button className="btn-ghost" onClick={onClear} aria-label="Clear all watchlist items">
            Clear All
          </button>
        )}
      </div>

      {movies.length === 0 ? (
        <div className="watchlist-empty">
          <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.4 }}>🎞️</div>
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
            Start Matching →
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {movies.map((movie, i) => (
            <motion.div
              key={movie.title}
              className="watchlist-card"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <img
                className="watchlist-card__poster"
                src={movie.poster_url}
                alt={movie.title}
                loading="lazy"
              />
              <div className="watchlist-card__info">
                <p className="watchlist-card__title" title={movie.title}>
                  {movie.title}
                </p>
                <p className="watchlist-card__meta">
                  {movie.year}
                  {movie.genres?.length > 0 && ` · ${movie.genres[0]}`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Watchlist;