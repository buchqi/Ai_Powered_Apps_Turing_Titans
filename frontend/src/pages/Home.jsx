import React from "react";
import ContentCard from "../components/ContentCard.jsx";
import MovieSwiper from "../components/MovieSwiper.jsx";

const Home = () => {
  return (
    <section className="home-page">
      <header className="home-page__hero">
        <h1 className="home-page__title">AI Movie Matchmaker</h1>
        <p style={{ color: 'var(--text-muted)' }}>Turing Titans: Find your perfect movie match.</p>
      </header>

      <div className="home-page__shell">
        <aside className="home-page__column">
          <ContentCard user="A" />
        </aside>

        <main className="home-page__column home-page__column--center">
          <MovieSwiper />
        </main>

        <aside className="home-page__column">
          <ContentCard user="B" />
        </aside>
      </div>
    </section>
  );
};

export default Home;