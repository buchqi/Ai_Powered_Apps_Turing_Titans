import React from 'react';

function MovieCard({ movie, onSwipe }) {
  if (!movie) return null;

  return (
    <article className="movie-card">
      <img 
        className="movie-card__poster" 
        src={movie.poster} 
        alt={movie.title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      <div className="movie-card__content">
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{movie.title}</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{movie.year} • {movie.genres?.join(', ')}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            onClick={() => onSwipe('dislike')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
          >
            Nope
          </button>
          <button 
            onClick={() => onSwipe('like')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#38bdf8', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            Like
          </button>
        </div>
      </div>
    </article>
  );
}

export default MovieCard;