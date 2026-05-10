import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🎭',
    title: 'Dual Preference Mapping',
    desc: 'Each user answers five independent questions so neither profile dominates the result.',
  },
  {
    icon: '🤖',
    title: 'AI Recommendation Engine',
    desc: 'A RAG pipeline retrieves candidates from a curated database, then Claude ranks and explains each match.',
  },
  {
    icon: '⚖️',
    title: 'Fairness Scoring',
    desc: 'Every recommendation includes a fairness score showing how well it satisfies both profiles equally.',
  },
  {
    icon: '🃏',
    title: 'Tinder-Style Swiping',
    desc: 'Swipe through cards together. Liked films are saved to a shared watchlist for the evening.',
  },
];

function About() {
  return (
    <main className="about-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p
          style={{
            fontSize: '0.68rem',
            letterSpacing: '3px',
            color: 'var(--accent-gold)',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          Turing Titans · AI Powered Apps
        </p>

        <h1 className="about-page__title">About Film Adviser</h1>
        <p className="about-page__lead">
          A couples and friends movie matcher that uses AI to find films everyone
          actually wants to watch — without the usual negotiation.
        </p>
      </motion.div>

      <hr className="about-divider" />

      {/* The Problem */}
      <section className="about-section">
        <p className="about-section__label">The Problem</p>
        <h2 className="about-section__heading">Deciding what to watch is broken.</h2>
        <p>
          Two people with different tastes end up either scrolling endlessly or one person
          reluctantly watching something they don't enjoy. Film Adviser collects each
          person's preferences separately, then finds the genuine overlap — not a
          compromise, but a film both people will genuinely want to see.
        </p>
      </section>

      {/* How it works */}
      <section className="about-section">
        <p className="about-section__label">How It Works</p>
        <h2 className="about-section__heading">AI that bridges the gap.</h2>
        <p style={{ marginBottom: '2vh' }}>
          Each user answers five quick questions covering mood, energy, genre, and
          dealbreakers. The backend merges both profiles and queries a vector database
          of films using a RAG (Retrieval-Augmented Generation) pipeline. Claude then
          ranks the candidates and generates a plain-English explanation for every
          recommendation.
        </p>

        <div className="about-features">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="about-feature"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="about-feature__icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <hr className="about-divider" />

      {/* Team */}
      <section className="about-section">
        <p className="about-section__label">The Team</p>
        <h2 className="about-section__heading">Turing Titans</h2>
        <p>
          Built as part of an AI-powered applications course. The team covers
          frontend, backend, AI services, and vector database integration — each
          working in parallel on a shared API contract.
        </p>
      </section>

      <div style={{ marginTop: '4vh' }}>
        <Link to="/match" className="btn-gold">
          Try Film Adviser →
        </Link>
      </div>
    </main>
  );
}

export default About;