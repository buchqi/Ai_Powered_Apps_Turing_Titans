import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

function MovieCard({ movie, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) onSwipe('like');
    else if (info.offset.x < -100) onSwipe('dislike');
  };

  return (
    <motion.article 
      className="movie-card"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <img className="movie-card__poster" src={movie.poster} alt={movie.title} />

      <div className="movie-card__content">
        <div className="ai-reason-badge">
          ✧ High Fairness: 98%
        </div>
        
        <h2>{movie.title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          {movie.year} • {movie.genres?.join(' / ')} <br/>
          <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
            "Matches your interest in deep psychology and partner B's love for slow-burns."
          </span>
        </p>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => onSwipe('dislike')}
            style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'white', cursor: 'pointer', transition: '0.2s' }}
          >
            Skip
          </button>
          <button 
            onClick={() => onSwipe('like')}
            style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--accent-red)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            I'd Watch This
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default MovieCard;