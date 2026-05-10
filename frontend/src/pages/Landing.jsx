import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const STEPS = [
  {
    num: '01',
    title: 'Build Your Profile',
    desc: 'Each person answers five questions about mood, genre, and energy. Takes under a minute.',
  },
  {
    num: '02',
    title: 'AI Merges Your Tastes',
    desc: 'Our recommendation engine finds films that genuinely satisfy both preference profiles — no compromises.',
  },
  {
    num: '03',
    title: 'Swipe Together',
    desc: 'Browse personalized cards as a pair. Like the ones you both want to watch and build your shared watchlist.',
  },
];

function Landing() {
  return (
    <main className="landing">
      {/* ── Hero ── */}
      <section className="landing__hero" aria-labelledby="hero-title">
        <motion.p className="landing__eyebrow" {...fadeUp(0)}>
          AI-Powered Movie Matching
        </motion.p>

        <motion.h1 className="landing__title" id="hero-title" {...fadeUp(0.1)}>
          Two Tastes.<br />One Perfect Film.
        </motion.h1>

        <motion.p className="landing__tagline" {...fadeUp(0.22)}>
          Stop arguing over what to watch. Film Adviser merges both of your preferences and surfaces movies you'll actually both love.
        </motion.p>

        <motion.div {...fadeUp(0.34)}>
          <Link to="/match" className="landing__cta">
            Start Matching →
          </Link>
        </motion.div>

        <motion.p
          className="landing__scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          aria-hidden="true"
        >
          ↓ How it works
        </motion.p>
      </section>

      {/* ── How It Works ── */}
      <section className="landing__steps" aria-labelledby="steps-title">
        <h2 className="landing__steps-title" id="steps-title">
          How It Works
        </h2>
        <div className="landing__steps-grid">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="landing__step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
            >
              <div className="landing__step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '5vh' }}>
          <Link to="/match" className="btn-gold">
            Try It Now
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Landing;