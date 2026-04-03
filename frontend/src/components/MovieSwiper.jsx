import { useState } from "react";
import MovieCard from "./MovieCard.jsx";

const MOVIES = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    rating: 8.8,
    genres: ["Sci-Fi", "Thriller"],
    description:
      "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into a CEO's mind.",
    poster: "https://image.tmdb.org/t/p/w780/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    cast: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
  },
  {
    id: 2,
    title: "The Matrix",
    year: 1999,
    rating: 8.7,
    genres: ["Action", "Sci-Fi"],
    description:
      "A computer hacker learns from mysterious rebels about the true nature of his reality.",
    poster: "https://image.tmdb.org/t/p/w780/aZXiWpM9aiJyd6beUfJ7gqQJUdT.jpg",
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
  },
  {
    id: 3,
    title: "Interstellar",
    year: 2014,
    rating: 8.6,
    genres: ["Adventure", "Drama", "Sci-Fi"],
    description:
      "Explorers travel through a wormhole in space to ensure humanity's survival.",
    poster: "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
  },
  {
    id: 4,
    title: "Blade Runner 2049",
    year: 2017,
    rating: 8.0,
    genres: ["Sci-Fi", "Thriller"],
    description:
      "Young Blade Runner K discovers a secret that leads him to former Blade Runner Rick Deckard.",
    poster: "https://image.tmdb.org/t/p/w780/gajva2L0rPYkEWj3FlGQqTntKnR.jpg",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"],
  },
  {
    id: 5,
    title: "Dune",
    year: 2021,
    rating: 8.0,
    genres: ["Sci-Fi", "Adventure"],
    description:
      "Paul Atreides leads nomadic tribes in a battle to control the desert planet Arrakis.",
    poster: "https://image.tmdb.org/t/p/w780/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    cast: ["Timothée Chalamet", "Zendaya", "Oscar Isaac"],
  },
  {
    id: 6,
    title: "Mad Max: Fury Road",
    year: 2015,
    rating: 8.1,
    genres: ["Action", "Adventure"],
    description:
      "In a post-apocalyptic wasteland, Max teams up with Furiosa to escape a tyrant.",
    poster: "https://image.tmdb.org/t/p/w780/hA2ple9q4qnwxp3hKVNhPGSmow.jpg",
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"],
  },
  {
    id: 7,
    title: "Arrival",
    year: 2016,
    rating: 7.9,
    genres: ["Drama", "Sci-Fi"],
    description:
      "A linguist works with the military to communicate with extraterrestrial visitors.",
    poster: "https://image.tmdb.org/t/p/w780/xG9iCQN1ooW8Wl7fLj2CK1nOLBR.jpg",
    cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker"],
  },
  {
    id: 8,
    title: "The Dark Knight",
    year: 2008,
    rating: 9.0,
    genres: ["Action", "Crime", "Drama"],
    description:
      "Batman faces the Joker, a criminal mastermind who plunges Gotham into chaos.",
    poster: "https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
  },
];

function MovieSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentMovie = MOVIES[currentIndex];
  const nextMovie = MOVIES[currentIndex + 1];

  const handleAction = (action) => {
    if (!currentMovie) return;

    console.log({
      title: currentMovie.title,
      year: currentMovie.year,
      description: currentMovie.description,
      action,
    });

    setCurrentIndex((index) => index + 1);
  };

  return (
    <section className="swiper">
      <div className="swiper__stage">
        {nextMovie ? (
          <div className="swiper__next-card" aria-hidden="true">
            <img src={nextMovie.poster} alt="" />
          </div>
        ) : null}

        {currentMovie ? (
          <MovieCard
            movie={currentMovie}
            onSwipe={handleAction}
            onLike={() => handleAction("like")}
            onDislike={() => handleAction("dislike")}
          />
        ) : (
          <div className="swiper__empty">
            <h2>No more movies</h2>
            <p>Refresh the list to start swiping again.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MovieSwiper;
