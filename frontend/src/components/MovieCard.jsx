import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

function MovieCard({ movie, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -80], [0, 1]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) onSwipe('like');
    else if (info.offset.x < -100) onSwipe('dislike');
  };

  // Stop pointer propagation so button clicks don't start a drag
  const stopDrag = (e) => e.stopPropagation();

  return (
    <motion.article
      className="movie-card"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      aria-label={`Movie card: ${movie.title}`}
    >
      <img
        className="movie-card__poster"
        src={movie.poster_url}
        alt={movie.title}
        draggable={false}
      />

      {/* LIKE stamp */}
      <motion.div
        style={{
          opacity: likeOpacity,
          position: 'absolute', top: 40, right: 40,
          border: '4px solid #4ade80', color: '#4ade80',
          padding: '8px 16px', borderRadius: '8px',
          fontSize: '2rem', fontWeight: 'bold',
          transform: 'rotate(15deg)', zIndex: 10,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        LIKE
      </motion.div>

      {/* NOPE stamp */}
      <motion.div
        style={{
          opacity: nopeOpacity,
          position: 'absolute', top: 40, left: 40,
          border: '4px solid #f87171', color: '#f87171',
          padding: '8px 16px', borderRadius: '8px',
          fontSize: '2rem', fontWeight: 'bold',
          transform: 'rotate(-15deg)', zIndex: 10,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        NOPE
      </motion.div>

      <div className="movie-card__content">
        <div className="ai-reason-badge">
          ✧ Match Score: {movie.ai_fairness_score}%
        </div>

        <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '6px' }}>
          {movie.title}
        </h2>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            marginBottom: '1.5rem',
            lineHeight: '1.5',
          }}
        >
          {movie.year} · {movie.genres?.join(' / ')}
          <br />
          <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>
            "{movie.ai_explanation}"
          </span>
        </p>

        {/* Buttons need pointerEvents: auto (parent has none) and stopDrag */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            pointerEvents: 'auto',
          }}
        >
          <button
            onPointerDown={stopDrag}
            onClick={() => onSwipe('dislike')}
            style={{
              flex: 1, padding: '13px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(0,0,0,0.45)',
              color: 'white', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: '0.2s',
            }}
            aria-label={`Skip ${movie.title}`}
          >
            Skip
          </button>
          <button
            onPointerDown={stopDrag}
            onClick={() => onSwipe('like')}
            style={{
              flex: 1, padding: '13px',
              borderRadius: '14px',
              background: 'var(--accent-red)',
              border: 'none', color: 'white',
              cursor: 'pointer', fontWeight: 'bold',
              fontFamily: 'Inter, sans-serif',
            }}
            aria-label={`Watch ${movie.title}`}
          >
            I'd Watch This
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default MovieCard;