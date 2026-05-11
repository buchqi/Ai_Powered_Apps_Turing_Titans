import React, { useState, useEffect, useCallback } from 'react';
import PreferenceCard from '../components/PreferenceCard.jsx';
import MovieSwiper from '../components/MovieSwiper.jsx';
import {
  addToWatchlist,
  createRecommendationSession,
  getMoreMovies,
} from '../api/recommendations.js';

const BATCH_SIZE = 10;

function Home({ onSessionChange, onWatchlistChange }) {
  const [prefA, setPrefA] = useState(null);
  const [prefB, setPrefB] = useState(null);
  const [quizResetId, setQuizResetId] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [movies, setMovies] = useState([]);

  const currentTurn = !prefA ? 'A' : !prefB ? 'B' : 'DONE';

  useEffect(() => {
    if (!prefA || !prefB) return;

    setIsAnalyzing(true);
    setError(null);
    setSessionId(null);
    setHasMore(false);
    setMovies([]);
    onSessionChange?.(null);
    onWatchlistChange?.([]);

    createRecommendationSession({ userA: prefA, userB: prefB }, BATCH_SIZE)
      .then((data) => {
        setSessionId(data.session_id);
        onSessionChange?.(data.session_id);
        setMovies(data.movies ?? []);
        setHasMore(Boolean(data.has_more));
        setIsAnalyzing(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Engine offline or failed to fetch matches.');
        setIsAnalyzing(false);
      });
  }, [onSessionChange, onWatchlistChange, prefA, prefB]);

  const handleLoadMore = useCallback(async () => {
    if (!sessionId || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await getMoreMovies(sessionId, BATCH_SIZE);
      setMovies((currentMovies) => [...currentMovies, ...(data.movies ?? [])]);
      setHasMore(Boolean(data.has_more));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load more recommendations.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, sessionId]);

  const handleLike = async (movie) => {
    if (!sessionId) return;

    try {
      const data = await addToWatchlist(sessionId, movie);
      onWatchlistChange?.(data.watchlist ?? []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not save this movie.');
    }
  };

  const handleDislike = useCallback(() => {}, []);

  const handleReset = () => {
    setPrefA(null);
    setPrefB(null);
    setMovies([]);
    setError(null);
    setSessionId(null);
    setHasMore(false);
    setIsAnalyzing(false);
    setIsLoadingMore(false);
    setQuizResetId((id) => id + 1);
    onSessionChange?.(null);
    onWatchlistChange?.([]);
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
          {currentTurn === 'A' && 'Waiting on - User A'}
          {currentTurn === 'B' && 'Waiting on - User B'}
          {currentTurn === 'DONE' && 'Matching Engine Online'}
        </p>
      </header>

      <div className="home-page__shell">
        <div className="home-page__column">
          <PreferenceCard
            key={`user-a-${quizResetId}`}
            user="A"
            isActive={currentTurn === 'A'}
            isDone={!!prefA}
            onComplete={setPrefA}
          />
        </div>

        <div className="home-page__column swiper__stage">
          <MovieSwiper
            key={sessionId ?? `quiz-${quizResetId}`}
            isReady={currentTurn === 'DONE'}
            isAnalyzing={isAnalyzing}
            isLoadingMore={isLoadingMore}
            movies={movies}
            canLoadMore={hasMore}
            error={error}
            onLike={handleLike}
            onDislike={handleDislike}
            onNearEnd={handleLoadMore}
            onReset={handleReset}
          />
        </div>

        <div className="home-page__column">
          <PreferenceCard
            key={`user-b-${quizResetId}`}
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
