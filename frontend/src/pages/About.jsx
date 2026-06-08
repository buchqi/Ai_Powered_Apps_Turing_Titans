import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🎭',
    title: 'Dual Preference Mapping',
    desc: 'Each user answers five independent questions so neither profile dominates the result.',
  },
  {
    icon: '🤖',
    title: 'AI Recommendation Engine',
    desc: 'A RAG pipeline retrieves candidates from a curated database, then AI ranks and explains each match.',
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

const TEAM = [
  {
    name: 'Giorgi Tkebuchava',
    role: 'Backend & AI Integration',
    description: 'AI logic, API integration, scoring system, and reliability. The engine that makes it all work.',
    github: 'buchqi',
    emoji: '⚙️',
  },
  {
    name: 'Gela Lomidze',
    role: 'Frontend & UI',
    description: 'User interface, UX flow, swipe system, and responsiveness. What you see is what Gela built.',
    github: 'gelalomidze',
    emoji: '🎨',
  },
  {
    name: 'Ivane Urjumelashvili',
    role: 'Database & Data Governance',
    description: 'Data modeling, vector storage, privacy, and data integrity. The foundation everything runs on.',
    github: 'ivaneu',
    emoji: '🗄️',
  },
];

export default function About() {
  return (
    <main className="about-page">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="about-page__eyebrow">Turing Titans · AI Powered Apps · Spring 2026</p>
        <h1 className="about-page__title">About Film Adviser</h1>
        <p className="about-page__lead">
          A couples and friends movie matcher that uses AI to find films everyone
          actually wants to watch — without the usual negotiation.
        </p>
      </Motion.div>

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
          of films using a RAG pipeline. The AI then ranks the candidates and generates
          a plain-English explanation for every recommendation.
        </p>

        <div className="about-features">
          {FEATURES.map((f, i) => (
            <Motion.div
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
            </Motion.div>
          ))}
        </div>
      </section>

      <hr className="about-divider" />

      {/* Team */}
      <section className="about-section">
        <p className="about-section__label">The Team</p>
        <h2 className="about-section__heading">Turing Titans</h2>
        <p style={{ marginBottom: '3vh' }}>
          Built as part of an AI-powered applications course at Kutaisi International University.
          Three people, one mission: make movie night actually easy.
        </p>

        <div className="team-grid">
          {TEAM.map((member, i) => (
            <Motion.div
              key={member.name}
              className="team-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              viewport={{ once: true }}
            >
              <div className="team-card__avatar">{member.emoji}</div>
              <h3 className="team-card__name">{member.name}</h3>
              <p className="team-card__role">{member.role}</p>
              <p className="team-card__desc">{member.description}</p>
              <a
                href={`https://github.com/${member.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="team-card__github"
              >
                @{member.github}
              </a>
            </Motion.div>
          ))}
        </div>
      </section>

      <div style={{ marginTop: '4vh' }}>
        <Link to="/match" className="btn-gold">Try Film Adviser →</Link>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p>© 2026 Turing Titans · Film Adviser. All rights reserved.</p>
        <p>CS-AI-2026 · Kutaisi International University</p>
      </footer>
    </main>
  );
}
