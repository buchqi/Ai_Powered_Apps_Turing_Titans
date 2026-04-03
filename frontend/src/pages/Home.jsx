import React from "react";
import ContentCard from "../components/ContentCard.jsx";
import MovieSwiper from "../components/MovieSwiper.jsx";

const Home = () => {
  return (
    <section className="home-page">
      <header className="home-page__hero">
        <span className="home-page__eyebrow">AI Movie Matchmaker</span>

        <p>
          Each person answers a short AI-style preference flow, then you meet in
          the middle with a swipe deck built for couples instead of endless
          scrolling.
        </p>
      </header>

      <div className="home-page__shell">
        <div className="home-page__column">
          <ContentCard user="A" />
        </div>

        <div className="home-page__column home-page__column--center">
          <MovieSwiper />
        </div>

        <div className="home-page__column">
          <ContentCard user="B" />
        </div>
      </div>
    </section>
  );
};

export default Home;
