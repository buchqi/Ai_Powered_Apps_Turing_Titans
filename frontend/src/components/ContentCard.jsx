import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// THE NEW UX-OPTIMIZED "BANG BANG" QUESTION PACK
const QUESTIONS = [
  { id: 'vibe', prompt: "What's the vibe tonight?", options: ['Laugh & Relax 😂', 'Edge of my Seat 🫣', 'Deep & Emotional 🥺'] },
  { id: 'brainpower', prompt: "Brainpower required?", options: ['Turn it off (Easy watch)', 'Keep me guessing (Plot twists)', 'Mind-bending (Complex)'] },
  { id: 'reality', prompt: "Choose your reality:", options: ['Grounded & Real-world', 'High Sci-Fi / Fantasy', 'Historical / Period'] },
  { id: 'action', prompt: "Action vs. Talk?", options: ['Explosions & Fights 💥', 'Tense & Suspenseful 🕵️‍♂️', 'Witty Banter & Drama 🗣️'] },
  { id: 'dealbreaker', prompt: "The Absolute Dealbreaker?", options: ['No Sad Endings', 'No Extreme Gore/Horror', 'I am fearless. Anything goes.'] }
];

function ContentCard({ user, isActive, isDone, onComplete }) {
  const [idx, setIdx] = useState(0);

  const handleSelection = (option) => {
    if (!isActive || isDone) return;
    
    if (idx < QUESTIONS.length - 1) {
      setIdx(idx + 1);
    } else {
      onComplete();
    }
  };

  const progress = ((idx + 1) / QUESTIONS.length) * 100;

  return (
    <motion.div 
      className="content-card"
      animate={{ 
        opacity: isActive ? 1 : (isDone ? 0.8 : 0.55), /* Increased from 0.3 for readability */
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'
      }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {isDone ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>User {user} Locked</h3>
          </motion.div>
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                {isActive ? `YOUR TURN: USER ${user}` : `WAITING: USER ${user}`}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{idx + 1}/5</span>
            </div>
            
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem', borderRadius: '2px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gold)', transition: 'width 0.3s ease-out' }} />
            </div>

            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: '1.5rem', minHeight: '3.5rem' }}>
              {QUESTIONS[idx].prompt}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {QUESTIONS[idx].options.map((opt) => (
                <button 
                  key={opt} 
                  className="content-card__option"
                  onClick={() => handleSelection(opt)}
                  disabled={!isActive || isDone}
                  style={{
                    cursor: isActive ? 'pointer' : 'not-allowed',
                    opacity: isActive ? 1 : 0.8 /* Button text stays highly readable */
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ContentCard;