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
      className="relative h-[520px] w-[min(380px,92vw)] select-none overflow-hidden rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
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
      <img
        src={movie.poster}
        alt={movie.title}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {position.x > 20 && !exiting && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 text-4xl font-bold tracking-[0.35em] text-white">
          LIKE
        </div>
      )}

      {position.x < -20 && !exiting && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-4xl font-bold tracking-[0.35em] text-white">
          NOPE
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex min-h-[140px] items-end px-6 pb-5 sm:min-h-[160px] sm:px-8 sm:pb-6">
        <p className="text-sm leading-relaxed text-white sm:text-base">
          {movie.description}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
