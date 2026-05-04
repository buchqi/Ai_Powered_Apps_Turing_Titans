import React, { useState, useEffect } from "react";
import ContentCard from "../components/ContentCard.jsx";
import MovieSwiper from "../components/MovieSwiper.jsx";
import { motion } from "framer-motion";

const Home = () => {
  const [userAReady, setUserAReady] = useState(false);
  const [userBReady, setUserBReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Bulletproof turn logic
  const currentTurn = !userAReady ? "A" : (!userBReady ? "B" : "DONE");

  useEffect(() => {
    if (userAReady && userBReady) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => setIsAnalyzing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [userAReady, userBReady]);

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
        {/* Left Column */}
        <div className="home-page__column" style={{ zIndex: currentTurn === "A" ? 10 : 1 }}>
          <ContentCard 
            user="A" 
            isActive={currentTurn === "A"}
            isDone={userAReady}
            onComplete={() => setUserAReady(true)} 
          />
        </div>

        {/* Center Column */}
        <div className="home-page__column">
          <MovieSwiper 
            userAReady={userAReady}
            userBReady={userBReady}
            isAnalyzing={isAnalyzing} 
          />
        </div>

        {/* Right Column */}
        <div className="home-page__column" style={{ zIndex: currentTurn === "B" ? 10 : 1 }}>
          <ContentCard 
            user="B" 
            isActive={currentTurn === "B"}
            isDone={userBReady}
            onComplete={() => setUserBReady(true)} 
          />
        </div>
      </div>
    </section>
  );
};

export default Home;