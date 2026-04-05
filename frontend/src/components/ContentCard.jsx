import React, { useState } from 'react';

const QUESTIONS = [
  { 
    id: 'pacing', 
    prompt: 'Preferred Narrative Pacing?', 
    options: ['Slow Burn (Atmospheric)', 'Steady (Balanced)', 'Breakneck (High Action)'] 
  },
  { 
    id: 'theme', 
    prompt: 'Core Story Focus?', 
    options: ['Technological/Sci-Fi', 'Human Psychology', 'Political/Social Intrigue'] 
  },
  { 
    id: 'visuals', 
    prompt: 'Visual Aesthetic?', 
    options: ['Neon/Cyberpunk', 'Gritty/Realistic', 'Vibrant/Stylized'] 
  },
  { 
    id: 'complexity', 
    prompt: 'Plot Complexity?', 
    options: ['Linear (Straightforward)', 'Non-Linear (Twisty)', 'Abstract (Open to Interpretation)'] 
  },
  { 
    id: 'tone', 
    prompt: 'Emotional Resonance?', 
    options: ['Cynical/Dark', 'Hopeful/Inspiring', 'Melancholic/Bittersweet'] 
  }
];

function ContentCard({ user = 'A' }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const handleSelection = (option) => {
    const currentQuestion = QUESTIONS[idx];
    setAnswers({ ...answers, [currentQuestion.id]: option });

    if (idx < QUESTIONS.length - 1) {
      setIdx(idx + 1);
    } else {
      setDone(true);
      console.log(`User ${user} Profile Complete:`, answers);
    }
  };

  if (done) return (
    <div className="content-card" style={{ border: '1px solid var(--accent)', boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✓</div>
        <h3 style={{ color: 'var(--accent)', margin: 0 }}>User {user} Profile Locked</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          AI is now prioritizing {answers.theme} and {answers.pacing} narratives.
        </p>
      </div>
    </div>
  );

  const progress = ((idx + 1) / QUESTIONS.length) * 100;

  return (
    <div className="content-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>
          USER {user} DATA ENTRY
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{idx + 1} / {QUESTIONS.length}</span>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', lineHeight: '1.4' }}>{QUESTIONS[idx].prompt}</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {QUESTIONS[idx].options.map(opt => (
          <button 
            key={opt} 
            className="content-card__option"
            onClick={() => handleSelection(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ContentCard;