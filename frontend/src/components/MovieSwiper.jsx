import React, { useState } from 'react';
import MovieCard from './MovieCard.jsx';

const mockMovies = [
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    description:
      'A thief who steals corporate secrets through use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.',
    poster: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
  },
  {
    id: 2,
    title: 'The Matrix',
    year: 1999,
    description:
      'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    poster: 'https://image.tmdb.org/t/p/w500/aZXiWpM9aiJyd6beUfJ7gqQJUdT.jpg',
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster: 'https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
  },
];

const MovieSwiper = () => {
  const [movies] = useState(mockMovies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setLikedMovies] = useState([]);

  const nextMovie = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleLike = (movie) => {
    setLikedMovies((prev) => [...prev, movie]);
    nextMovie();
  };

  const handleDislike = (movie) => {
    nextMovie();
  };

  const currentMovie = movies[currentIndex];

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md shadow-2xl">

        {currentMovie ? (
          <>
            <MovieCard
              key={currentMovie.id}
              movie={currentMovie}
              onLike={handleLike}
              onDislike={handleDislike}
            />

            {/* ✅ Action Buttons */}
            <div className="flex items-center gap-6">
              {/* Dislike */}
              <button
                onClick={() => handleDislike(currentMovie)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400 shadow-lg ring-1 ring-red-400/30 hover:scale-110 hover:bg-red-500/30 transition"
              >
                ✕
              </button>

              {/* Like */}
              <button
                onClick={() => handleLike(currentMovie)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400 shadow-lg ring-1 ring-green-400/30 hover:scale-110 hover:bg-green-500/30 transition"
              >
                ♥
              </button>
            </div>
          </>
        ) : (
          <div className="px-6 py-10 text-lg font-semibold text-slate-400">
            No more movies
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieSwiper;