import { useState } from "react";
import MovieCard from "./MovieCard.jsx";
import { MOCK_MOVIES } from "../data/movies.js";

function MovieSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentMovie = MOCK_MOVIES[currentIndex];

  const handleAction = (action) => {
    if (!currentMovie) return;
    console.log(`Action: ${action} on ${currentMovie.title}`);
    setCurrentIndex((index) => index + 1);
  };

  return (
    <section className="swiper">
      <div className="swiper__stage">
        {currentMovie ? (
          <MovieCard
            movie={currentMovie}
            onSwipe={handleAction}
            onLike={() => handleAction("like")}
            onDislike={() => handleAction("dislike")}
          />
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '50px' }}>
            <h2>No more movies!</h2>
            <button 
               onClick={() => setCurrentIndex(0)}
               style={{ background: 'var(--accent)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default MovieSwiper;