import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

/**
 * Steps map 1-to-1 with backend UserPreferences:
 *   vibe | brainpower | reality | action | dealbreaker
 */
const STEPS = [
  {
    field: 'vibe',
    question: "What's your mood tonight?",
    options: [
      'Warm & feel-good',
      'Dark & intense',
      'Chill & easy',
      'Epic adventure',
    ],
  },
  {
    field: 'brainpower',
    question: 'How hard do you want to think?',
    options: [
      'Zero — just vibes',
      'A little — keep me engaged',
      'Full power — challenge me',
    ],
  },
  {
    field: 'reality',
    question: 'Preferred world?',
    options: [
      'Real world drama',
      'Sci-Fi or Fantasy',
      'Either works for me',
    ],
  },
  {
    field: 'action',
    question: 'Action level?',
    options: [
      'Slow burn',
      'Balanced',
      'Non-stop action',
    ],
  },
  {
    field: 'dealbreaker',
    question: 'Hard dealbreaker?',
    options: [
      'No extreme violence',
      'No heavy romance',
      'No horror',
      'No subtitles',
      "I'm easy — no limits",
    ],
  },
];

function PreferenceCard({ user, isActive, isDone, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleSelect = (value) => {
    const field = STEPS[step].field;
    const updated = { ...answers, [field]: value };
    setAnswers(updated);

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete(updated);
    }
  };

  const current = STEPS[step];
  return (
    <div
      className="content-card"
      style={{
        opacity: isDone ? 0.55 : isActive ? 1 : 0.35,
        transition: 'opacity 0.4s',
        width: '100%',
      }}
      role="region"
      aria-label={`User ${user} preference questionnaire`}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.68rem',
            letterSpacing: '3px',
            color: 'var(--accent-gold)',
            fontWeight: 700,
            marginBottom: '10px',
            textTransform: 'uppercase',
          }}
        >
          User {user}
        </div>

        {isDone ? (
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem' }}>
            ✓ Profile Locked
          </h2>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <Motion.h2
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.05rem',
                  marginBottom: '14px',
                  lineHeight: 1.4,
                }}
              >
                {current.question}
              </Motion.h2>
            </AnimatePresence>

            {/* Step progress bar */}
            <div
              style={{ display: 'flex', gap: '5px', marginBottom: '1.4rem' }}
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-label={`Step ${step + 1} of ${STEPS.length}`}
            >
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '3px',
                    flex: 1,
                    borderRadius: '2px',
                    background:
                      i < step
                        ? 'var(--accent-gold)'
                        : i === step
                        ? 'rgba(251, 191, 36, 0.5)'
                        : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Options — only shown when active and not done */}
      {!isDone && isActive && (
        <AnimatePresence mode="wait">
          <Motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.2 }}
          >
            {current.options.map((opt) => (
              <button
                key={opt}
                className="content-card__option"
                onClick={() => handleSelect(opt)}
                aria-label={opt}
              >
                {opt}
              </button>
            ))}
          </Motion.div>
        </AnimatePresence>
      )}

      {/* Waiting state */}
      {!isDone && !isActive && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {user === 'A'
            ? 'Waiting for User A to answer…'
            : 'Waiting for User A to finish first…'}
        </p>
      )}

      {/* Summary after completion */}
      {isDone && (
        <div
          style={{
            fontSize: '0.82rem',
            lineHeight: 1.9,
            color: 'var(--text-muted)',
          }}
        >
          {Object.entries(answers).map(([key, val]) => (
            <div key={key}>
              <span
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'capitalize',
                  marginRight: '6px',
                }}
              >
                {key}:
              </span>
              {val}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PreferenceCard;
