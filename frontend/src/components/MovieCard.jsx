import { useRef, useState } from 'react';

const SWIPE_THRESHOLD = 70;
const EXIT_DISTANCE = 420;

function MovieCard({ movie, onSwipe, onLike, onDislike }) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startX = useRef(0);
  const activePointerId = useRef(null);

  const resetCard = () => {
    setDragging(false);
    setOffsetX(0);
    activePointerId.current = null;
  };

  const handlePointerDown = (event) => {
    if (exiting) return;

    startX.current = event.clientX;
    activePointerId.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragging || exiting || activePointerId.current !== event.pointerId) return;

    setOffsetX(event.clientX - startX.current);
  };

  const commitSwipe = (action) => {
    if (exiting) return;

    const direction = action === 'like' ? 1 : -1;

    setDragging(false);
    setExiting(true);
    setOffsetX(direction * EXIT_DISTANCE);

    window.setTimeout(() => {
      onSwipe(action);
      setExiting(false);
      setOffsetX(0);
      activePointerId.current = null;
    }, 260);
  };

  const handlePointerUp = (event) => {
    if (!dragging || activePointerId.current !== event.pointerId) return;

    const movedX = event.clientX - startX.current;

    if (movedX >= SWIPE_THRESHOLD) {
      commitSwipe('like');
      return;
    }

    if (movedX <= -SWIPE_THRESHOLD) {
      commitSwipe('dislike');
      return;
    }

    resetCard();
  };

  const handleButtonSwipe = (event, action) => {
    event.preventDefault();
    event.stopPropagation();
    commitSwipe(action);
  };

  const rotation = offsetX / 12;

  return (
    <article
      className="movie-card"
      style={{
        transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
        transition: dragging ? 'none' : 'transform 260ms ease, opacity 260ms ease',
        opacity: exiting ? 0 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetCard}
    >
      <img className="movie-card__poster" src={movie.poster} alt={movie.title} draggable={false} />

      <div className="movie-card__badge movie-card__badge--like" style={{ opacity: offsetX > 16 ? 1 : 0 }}>
        LIKE
      </div>
      <div
        className="movie-card__badge movie-card__badge--dislike"
        style={{ opacity: offsetX < -16 ? 1 : 0 }}
      >
        NOPE
      </div>

      <div className="movie-card__content">
        <div className="movie-card__content-inner">
          <div className="movie-card__meta">
            <h2>{movie.title}</h2>
            <span>{movie.year}</span>
          </div>
          <p>{movie.description}</p>
        </div>
      </div>

      <div className="movie-card__actions">
        <button
          type="button"
          className="movie-card__button movie-card__button--dislike"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => handleButtonSwipe(event, 'dislike')}
          aria-label="Dislike movie"
        >
          <span aria-hidden="true">Dislike</span>
        </button>
        <button
          type="button"
          className="movie-card__button movie-card__button--like"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => handleButtonSwipe(event, 'like')}
          aria-label="Like movie"
        >
          <span aria-hidden="true">Like</span>
        </button>
      </div>
    </article>
  );
}

export default MovieCard;
