import React, { useState, useEffect } from "react";
import ContentCard from "../components/ContentCard.jsx";
import MovieSwiper from "../components/MovieSwiper.jsx";

const Home = () => {
  const [prefA, setPrefA] = useState(null);
  const [prefB, setPrefB] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [movies, setMovies] = useState([]);

  const currentTurn = !prefA ? "A" : (!prefB ? "B" : "DONE");

  useEffect(() => {
    if (prefA && prefB) {
      setIsAnalyzing(true);
      
      fetch("http://localhost:8000/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_a: prefA, user_b: prefB })
      })
        .then(res => res.json())
        .then(data => {
          setMovies(data);
          setIsAnalyzing(false);
        })
        .catch(err => {
          console.error(err);
          setIsAnalyzing(false);
        });
    }
  }, [prefA, prefB]);

  return (
    <section className="home-page">
      <header className="home-page__hero">
        <h1 className="home-page__title">Film Adviser</h1>
        <div style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', letterSpacing: '2px', marginTop: '8px', fontWeight: 'bold' }}>
          {currentTurn === "A" && "WAITING ON: USER A"}
          {currentTurn === "B" && "WAITING ON: USER B"}
          {currentTurn === "DONE" && "MATCHING ENGINE ONLINE"}
        </div>
      </header>

      <div className="home-page__shell">
        <div className="home-page__column">
          <ContentCard 
            user="A" 
            isActive={currentTurn === "A"}
            isDone={!!prefA}
            onComplete={setPrefA} 
          />
        </div>

        <div className="home-page__column">
          <MovieSwiper 
            isReady={currentTurn === "DONE"}
            isAnalyzing={isAnalyzing} 
            movies={movies}
          />
        </div>

        <div className="home-page__column">
          <ContentCard 
            user="B" 
            isActive={currentTurn === "B"}
            isDone={!!prefB}
            onComplete={setPrefB} 
          />
        </div>
      </div>
    </section>
  );
};

export default Home;