import React, { useState, useEffect } from 'react';
import PreferenceCard from '../components/PreferenceCard.jsx';
import MovieSwiper from '../components/MovieSwiper.jsx';

function Home({ onLike }) {
  const [prefA, setPrefA] = useState(null);
  const [prefB, setPrefB] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [movies, setMovies] = useState([]);

  const currentTurn = !prefA ? 'A' : !prefB ? 'B' : 'DONE';

  useEffect(() => {
    if (!prefA || !prefB) return;

    setIsAnalyzing(true);
    setError(null);

    fetch('http://localhost:8000/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_a: prefA, user_b: prefB }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Server communication failed.');
        return res.json();
      })
      .then((data) => {
        setMovies(data);
        setIsAnalyzing(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Engine offline or failed to fetch matches.');
        setIsAnalyzing(false);
      });
  }, [prefA, prefB]);

  const handleReset = () => {
    setPrefA(null);
    setPrefB(null);
    setMovies([]);
    setError(null);
    setIsAnalyzing(false);
  };

  return (
    <section className="home-page">
      <header className="home-page__hero">
        <h1 className="home-page__title">Film Adviser</h1>
        <p
          style={{
            color: 'var(--accent-gold)',
            fontSize: '0.7rem',
            letterSpacing: '2.5px',
            marginTop: '6px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
          aria-live="polite"
        >
          {currentTurn === 'A' && 'Waiting on · User A'}
          {currentTurn === 'B' && 'Waiting on · User B'}
          {currentTurn === 'DONE' && 'Matching Engine Online'}
        </p>
      </header>

      <div className="home-page__shell">
        <div className="home-page__column">
          <PreferenceCard
            user="A"
            isActive={currentTurn === 'A'}
            isDone={!!prefA}
            onComplete={setPrefA}
          />
        </div>

        <div className="home-page__column swiper__stage">
          <MovieSwiper
            isReady={currentTurn === 'DONE'}
            isAnalyzing={isAnalyzing}
            movies={movies}
            error={error}
            onLike={onLike}
            onReset={handleReset}
          />
        </div>

        <div className="home-page__column">
          <PreferenceCard
            user="B"
            isActive={currentTurn === 'B'}
            isDone={!!prefB}
            onComplete={setPrefB}
          />
        </div>
      </div>
    </section>
  );
}

export default Home;