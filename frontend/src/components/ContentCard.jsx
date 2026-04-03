import { useMemo, useState } from 'react';

const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'What kind of emotional experience do you want from the movie?',
    options: [
      { key: 'A', label: 'Intense and immersive' },
      { key: 'B', label: 'Light and easy' },
      { key: 'C', label: 'Thought-provoking' },
      { key: 'D', label: 'Unpredictable / mind-blowing' },
    ],
  },
  {
    id: 'q2',
    prompt: 'How much complexity do you enjoy in a movie’s story?',
    options: [
      { key: 'A', label: 'Simple and straightforward' },
      { key: 'B', label: 'Moderate with some twists' },
      { key: 'C', label: 'Complex with multiple layers' },
      { key: 'D', label: 'Confusing is okay if rewarding' },
    ],
  },
  {
    id: 'q3',
    prompt: 'What pacing do you prefer?',
    options: [
      { key: 'A', label: 'Fast-paced' },
      { key: 'B', label: 'Balanced pacing' },
      { key: 'C', label: 'Slow-paced' },
      { key: 'D', label: 'No preference' },
    ],
  },
  {
    id: 'q4',
    prompt: 'How important are plot twists to you?',
    options: [
      { key: 'A', label: 'Love frequent twists' },
      { key: 'B', label: 'Some twists' },
      { key: 'C', label: 'Prefer predictable' },
      { key: 'D', label: 'Doesn’t matter' },
    ],
  },
  {
    id: 'q5',
    prompt: 'Which matters more to you?',
    options: [
      { key: 'A', label: 'Story / plot' },
      { key: 'B', label: 'Characters / acting' },
      { key: 'C', label: 'Visuals / cinematography' },
      { key: 'D', label: 'Overall vibe / atmosphere' },
    ],
  },
];

function ContentCard({ user = 'A', userId, onComplete }) {
  const userLabel = userId ?? user;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const currentQuestion = QUESTIONS[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const progressPercent = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const summary = useMemo(
    () => ({
      user: userLabel,
      answers,
    }),
    [answers, userLabel],
  );

  const submitAnswers = (nextAnswers) => {
    const detailedAnswers = QUESTIONS.reduce((accumulator, question) => {
      const selectedKey = nextAnswers[question.id];
      const selectedOption = question.options.find((option) => option.key === selectedKey);

      accumulator[question.id] = {
        question: question.prompt,
        answer: selectedOption?.label ?? '',
      };

      return accumulator;
    }, {});

    const payload = {
      user: userLabel,
      answers: detailedAnswers,
    };

    console.log(payload);
    setResult(payload);
    setIsSubmitted(true);
    onComplete?.(payload);
  };

  const handleSelect = (optionKey) => {
    if (!currentQuestion) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: optionKey,
    };

    setAnswers(nextAnswers);

    if (currentIndex === QUESTIONS.length - 1) {
      submitAnswers(nextAnswers);
      return;
    }

    window.setTimeout(() => {
      setCurrentIndex((index) => index + 1);
    }, 180);
  };

  const handleBack = () => {
    if (isSubmitted) {
      setIsSubmitted(false);
      setCurrentIndex(QUESTIONS.length - 1);
      return;
    }

    if (currentIndex === 0) return;
    setCurrentIndex((index) => index - 1);
  };

  if (isSubmitted && result) {
    return (
      <section className="content-card" aria-live="polite">
        <div className="content-card__header">
          <span className="content-card__eyebrow">User {userLabel}</span>
          <h2>Preferences Saved</h2>
          <p>Your movie preferences are saved. AI can now use them to find better recommendations for you.</p>
        </div>

        <div className="content-card__footer">
          <button type="button" className="content-card__nav-button" onClick={handleBack}>
            Back
          </button>
          <p className="content-card__hint">Your detailed answers were printed to the console for now.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-card" aria-live="polite">
      <div className="content-card__header">
        <span className="content-card__eyebrow">User {userLabel}</span>
        <div className="content-card__progress-row">
          <p>
            Question {currentIndex + 1}/{QUESTIONS.length}
          </p>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="content-card__progress" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="content-card__body" key={currentQuestion.id}>
        <h2>{currentQuestion.prompt}</h2>
        <div className="content-card__options">
          {currentQuestion.options.map((option) => {
            const isActive = selectedAnswer === option.key;

            return (
              <button
                key={option.key}
                type="button"
                className={`content-card__option${isActive ? ' is-active' : ''}`}
                onClick={() => handleSelect(option.key)}
              >
                <span className="content-card__option-key">{option.key}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="content-card__footer">
        <button
          type="button"
          className="content-card__nav-button"
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          Back
        </button>
        <p className="content-card__hint">Selecting an option automatically moves to the next question.</p>
      </div>
    </section>
  );
}

export default ContentCard;
