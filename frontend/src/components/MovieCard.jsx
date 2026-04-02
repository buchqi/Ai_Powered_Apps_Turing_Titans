import React, { useRef, useState } from 'react';

const MovieCard = ({ movie, onLike, onDislike }) => {
  if (!movie) return null;

  const [position, setPosition] = useState({ x: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);

  const startX = useRef(0);
  const currentX = useRef(0);

  const threshold = 100;

  const handleMouseDown = (e) => {
    if (exiting) return;
    setDragging(true);
    startX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!dragging || exiting) return;

    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;

    setPosition({ x: deltaX });
  };

  const handleMouseUp = () => {
    if (!dragging || exiting) return;

    setDragging(false);

    const deltaX = currentX.current - startX.current;

    if (deltaX > threshold) {
      triggerSwipe('right');
    } else if (deltaX < -threshold) {
      triggerSwipe('left');
    } else {
      setPosition({ x: 0 });
    }
  };

  const triggerSwipe = (direction) => {
    setExiting(true);

    setPosition({
      x: direction === 'right' ? 300 : -300,
    });

    setTimeout(() => {
      if (direction === 'right') onLike(movie);
      else onDislike(movie);
    }, 200);
  };

  const rotation = position.x / 20;

  return (
    <div
      className="relative h-[520px] w-[min(380px,92vw)] select-none rounded-[18px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
      style={{
        transform: `translateX(${position.x}px) rotate(${rotation}deg)`,
        transition:
          dragging || exiting
            ? 'none'
            : 'transform 0.25s ease-out, opacity 0.25s ease-out',
        opacity: exiting ? 0 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Poster */}
      <img
        src={movie.poster}
        alt={movie.title}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* LIKE / NOPE overlay */}
      {position.x > 20 && !exiting && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/25 text-4xl font-bold text-white">
          LIKE
        </div>
      )}

      {position.x < -20 && !exiting && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/25 text-4xl font-bold text-white">
          NOPE
        </div>
      )}

      {/* Action Buttons (ONLY PLACE) */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-10 z-20">
        
        <button
          onClick={() => triggerSwipe('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/90 text-white text-2xl shadow-lg active:scale-95 transition"
        >
          👎
        </button>

        <button
          onClick={() => triggerSwipe('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/90 text-white text-2xl shadow-lg active:scale-95 transition"
        >
          👍
        </button>

      </div>

      {/* Bottom Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white">
        <h2 className="text-2xl font-bold">{movie.title}</h2>

        <div className="mt-1 flex items-center gap-3 text-sm text-zinc-300">
          <span>{movie.year}</span>
          {movie.rating && (
            <span className="text-amber-400">
              ★ {movie.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-zinc-200 line-clamp-3">
          {movie.description}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;