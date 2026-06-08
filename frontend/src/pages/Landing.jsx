import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const STEPS = [
  {
    num: '01',
    emoji: '🎭',
    title: 'Build Your Profile',
    desc: 'Each person answers five questions about mood, genre, and energy. Takes under a minute.',
  },
  {
    num: '02',
    emoji: '🤖',
    title: 'AI Merges Your Tastes',
    desc: 'Our recommendation engine finds films that genuinely satisfy both preference profiles — no compromises.',
  },
  {
    num: '03',
    emoji: '🃏',
    title: 'Swipe Together',
    desc: 'Browse personalized cards as a pair. Like the ones you both want to watch and build your shared watchlist.',
  },
];

const STATS = [
  { value: '10K+', label: 'Films Analyzed' },
  { value: '2', label: 'Users Per Session' },
  { value: '< 1 min', label: 'To First Match' },
];

export default function Landing() {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();

  function handleGuest() {
    loginAsGuest();
    navigate('/match');
  }

  return (
    <main className="landing">
      {/* ── Hero ── */}
      <section className="landing__hero" aria-labelledby="hero-title">
        <Motion.div className="landing__glow" aria-hidden="true" />

        <Motion.p className="landing__eyebrow" {...fadeUp(0)}>
          ✨ AI-Powered Movie Matching
        </Motion.p>

        <Motion.h1 className="landing__title" id="hero-title" {...fadeUp(0.1)}>
          Two Tastes.<br />
          <span className="landing__title-accent">One Perfect Film.</span>
        </Motion.h1>

        <Motion.p className="landing__tagline" {...fadeUp(0.22)}>
          Stop arguing over what to watch. Film Adviser merges both of your preferences
          and surfaces movies you'll actually both love.
        </Motion.p>

        <Motion.div className="landing__cta-group" {...fadeUp(0.34)}>
          <Link to="/signup" className="landing__cta landing__cta--primary">
            Get Started Free →
          </Link>
          <button className="landing__cta landing__cta--ghost" onClick={handleGuest}>
            Try as Guest
          </button>
        </Motion.div>

        <Motion.div
          className="landing__stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {STATS.map(s => (
            <div key={s.label} className="landing__stat">
              <span className="landing__stat-value">{s.value}</span>
              <span className="landing__stat-label">{s.label}</span>
            </div>
          ))}
        </Motion.div>

        <Motion.p
          className="landing__scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          aria-hidden="true"
        >
          ↓ How it works
        </Motion.p>
      </section>

      {/* ── How It Works ── */}
      <section className="landing__steps" aria-labelledby="steps-title">
        <h2 className="landing__steps-title" id="steps-title">How It Works</h2>
        <div className="landing__steps-grid">
          {STEPS.map((step, i) => (
            <Motion.div
              key={step.num}
              className="landing__step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
            >
              <div className="landing__step-emoji">{step.emoji}</div>
              <div className="landing__step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </Motion.div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '5vh', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" className="btn-gold">Create Account →</Link>
          <button className="btn-ghost" onClick={handleGuest}>Continue as Guest</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <p>© 2026 Turing Titans · Film Adviser. All rights reserved.</p>
        <p>
          <Link to="/about" style={{ color: 'inherit', textDecoration: 'underline' }}>
            About the team
          </Link>
          {' · '}
          <Link to="/match" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Start Matching
          </Link>
        </p>
      </footer>
    </main>
  );
}
