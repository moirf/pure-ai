import React, { useState, useRef, useEffect } from 'react';

type Question = {
  text: string;
  choices: string[];
  answer: number;
};

const steps = [
  { id: 1, title: 'Get Noticed', icon: '✉️', key: 'noticed' },
  { id: 2, title: 'Get Hired', icon: '💼', key: 'hired' },
  { id: 3, title: 'Get Paid More', icon: '💵', key: 'paid' },
  { id: 4, title: 'Get promoted', icon: '👑', key: 'promoted' },
];

// Sample question sets for each step — replace or extend with real questions/API later.
const QUESTION_SETS: Record<string, Question[]> = {
  noticed: [
    { text: 'Which is the best way to improve visibility?', choices: ['Networking', 'Hide work', 'Ignore PRs'], answer: 0 },
    { text: 'A strong headline should be:', choices: ['Vague', 'Role + Value', 'Too long'], answer: 1 },
  ],
  hired: [
    { text: 'What is important for interviews?', choices: ['Preparation', 'Arrive late', 'No questions'], answer: 0 },
    { text: 'Best way to demonstrate skills?', choices: ['Talk generically', 'Show portfolio', 'Avoid examples'], answer: 1 },
  ],
  paid: [
    { text: 'How to negotiate salary?', choices: ['Demand', 'Research market', 'Accept first offer'], answer: 1 },
    { text: 'What increases pay?', choices: ['Certifications', 'No training', 'Isolation'], answer: 0 },
  ],
  promoted: [
    { text: 'Key to promotion is:', choices: ['Deliver impact', 'Stay invisible', 'Refuse feedback'], answer: 0 },
    { text: 'Mentorship helps by:', choices: ['Blocking growth', 'Providing guidance', 'Adding noise'], answer: 1 },
  ],
};

function getDescriptionForKey(key: string) {
  switch (key) {
    case 'noticed':
      return 'Improve your visibility: tips on networking, personal branding, and outreach.';
    case 'hired':
      return 'Interview readiness: practice common questions, portfolio presentation and storytelling.';
    case 'paid':
      return 'Compensation & negotiation: research, positioning, and building leverage.';
    case 'promoted':
      return 'Career growth: demonstrating impact, leadership and mentorship to earn promotion.';
    default:
      return 'Learn and grow with targeted micro-lessons for this topic.';
  }
}

function calculateProgress(key: string, started: boolean, questions: Question[], current: number) {
  if (!started || questions.length === 0) return '0%';
  const pct = Math.round(((current) / questions.length) * 100);
  return `${pct}%`;
}

const Avatar: React.FC<{ initials: string; color?: string }> = ({ initials, color = 'bg-blue-200' }) => (
  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${color}`}>
    {initials}
  </div>
);

const StepItem = React.forwardRef<HTMLLIElement, { step: typeof steps[number]; active?: boolean; onClick?: () => void }>(
  ({ step, active, onClick }, ref) => (
    <li
      ref={ref}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 cursor-pointer ${active ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
    >
      <div className="text-2xl" aria-hidden>
        {step.icon}
      </div>
      <div className="flex-1">
        <div className={`text-sm ${active ? 'text-blue-600' : 'text-gray-800'}`}>{step.title}</div>
      </div>
    </li>
  )
);
StepItem.displayName = 'StepItem';

const InfoCard: React.FC<{ tone?: 'green' | 'purple'; title: string; children: React.ReactNode }> = ({ tone = 'green', title, children }) => {
  const base = 'p-6 rounded-xl shadow-sm';
  const toneClass = tone === 'green' ? 'bg-green-50' : 'bg-purple-50';
  return (
    <div className={`${base} ${toneClass}`}>
      <h3 className="text-xl font-semibold mb-2 flex items-center gap-3">
        <span className="inline-block w-8 h-8 rounded-md bg-white flex items-center justify-center">{tone === 'green' ? '🟢' : '🟣'}</span>
        {title}
      </h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
};

const Quiz: React.FC = () => {
  const [active, setActive] = useState<number>(4);
  const [started, setStarted] = useState(false);
  // We'll fetch one question at a time from the API.
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<number[]>([]); // -1 = unanswered, 1 = correct, 0 = wrong
  const [current, setCurrent] = useState(0); // index in the sequence 0..(total-1)
  const [score, setScore] = useState(0);
  const totalQuestions = 15;
  const [selected, setSelected] = useState<number | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingSet, setLoadingSet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStep = steps.find((s) => s.id === active) || steps[0];
  // refs for alignment
  const leftListRef = useRef<HTMLUListElement | null>(null);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const centerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Keep the center column pinned to the top-start. Clear any marginTop set previously.
    function resetCenter() {
      if (centerRef.current) centerRef.current.style.marginTop = '';
    }

    resetCenter();
    window.addEventListener('resize', resetCenter);
    return () => window.removeEventListener('resize', resetCenter);
  }, [active]);

  const startSet = async () => {
    const setKey = activeStep.key;
    setLoadingSet(true);
    setError(null);
    try {
      // initialize answers for the whole session
      setAnswers(new Array(totalQuestions).fill(-1));
      setCurrent(0);
      setScore(0);
      setSelected(null);
      setStarted(true);
      // fetch the first question
      await fetchQuestion(0, setKey);
    } catch (err: any) {
      console.error('startSet error', err);
      setError(String(err?.message ?? err));
      setStarted(false);
    } finally {
      setLoadingSet(false);
    }
  };

  async function fetchQuestion(index: number, setKey?: string) {
    setLoadingQuestion(true);
    setError(null);
    try {
      const key = setKey ?? activeStep.key;
      const res = await fetch(`/api/questions?set=${encodeURIComponent(key)}&index=${index}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // API may return an array or a single object.
      let q: any = null;
      if (Array.isArray(data)) {
        // prefer the provided index if available, else take first
        q = data[index] ?? data[0];
      } else {
        q = data;
      }
      if (!q) throw new Error('No question returned');
      const parsed: Question = {
        text: q.text || q.question || 'Untitled',
        choices: Array.isArray(q.choices) ? q.choices : q.options || [],
        answer: typeof q.answer === 'number' ? q.answer : 0,
      };

      setCurrentQuestion(parsed);
      setSelected(null);
    } catch (err: any) {
      // fallback: pick a random question from local set
      console.warn('Failed to fetch question, falling back to local sample:', err?.message || err);
      const local = QUESTION_SETS[activeStep.key] || [];
      const pick = local.length ? local[index % local.length] : { text: 'Fallback question', choices: ['A', 'B', 'C'], answer: 0 };
      setCurrentQuestion(pick);
      setError(err?.message ? String(err.message) : 'Failed to fetch question');
    } finally {
      setLoadingQuestion(false);
    }
  }

  const handleSelect = (idx: number) => {
    if (!currentQuestion) return;
    if (selected !== null) return; // already selected
    setSelected(idx);
  };

  const handleSubmitAnswer = async () => {
    if (selected === null || !currentQuestion) return;
    const correct = currentQuestion.answer === selected;
    setAnswers((prev) => {
      const copy = [...prev];
      copy[current] = correct ? 1 : 0;
      return copy;
    });
    if (correct) setScore((s) => s + 1);

    const next = current + 1;
    if (next < totalQuestions) {
      setCurrent(next);
      // fetch next question
      await fetchQuestion(next);
    } else {
      // finished
      setStarted(false);
      setCurrentQuestion(null);
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrentQuestion(null);
    setAnswers([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
  };

  return (
    <div className="w-full px-6 md:px-10">
      <div className="grid grid-cols-1 md:[grid-template-columns:2fr_8fr_2fr] gap-6">
        {/* Left column - steps list */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <ul className="divide-y" ref={leftListRef}>
            {steps.map((s, i) => (
              <StepItem
                key={s.id}
                step={s}
                active={s.id === active}
                ref={(el) => (stepRefs.current[i] = el)}
                onClick={() => {
                  setActive(s.id);
                  reset();
                }}
              />
            ))}
          </ul>
        </div>

        {/* Center card (details for the active set) */}
        <div ref={centerRef}>
          <InfoCard tone="green" title={activeStep.title}>
            {/* Segmented progress bar (green=correct, red=wrong, gray=unanswered) */}
            <div className="mb-4">
              <div className="w-full h-3 bg-gray-100 rounded overflow-hidden flex">
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const state = answers[i] ?? -1;
                  const width = `${100 / totalQuestions}%`;
                  const cls = state === 1 ? 'bg-green-500' : state === 0 ? 'bg-red-500' : 'bg-gray-300';
                  return <div key={i} className={`${cls} h-3`} style={{ width }} />;
                })}
              </div>
            </div>

            <p className="mb-4">{getDescriptionForKey(activeStep.key)}</p>

            <div className="mt-6">
              {!started ? (
                <div className="flex gap-2">
                  <button onClick={startSet} disabled={loadingSet} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loadingSet ? 'Loading…' : 'Start Set'}</button>
                </div>
              ) : (
                <div className="text-sm text-gray-700">In progress — question {current + 1} / {totalQuestions}</div>
              )}

              {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            </div>
          </InfoCard>
          {/* Inline quiz UI — appears when started */}
          {started && currentQuestion && (
            <div className="mt-6 bg-white p-6 rounded shadow w-full">
              <div className="text-lg font-semibold mb-4">{currentQuestion.text}</div>

              <div className="grid gap-3">
                {currentQuestion.choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                    className={`text-left px-4 py-3 border rounded hover:bg-gray-100 ${selected === i ? 'bg-indigo-50 border-indigo-400' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Score: {score}</div>
                <div className="flex gap-2">
                  <button onClick={reset} className="px-3 py-2 border rounded">Stop</button>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selected === null || loadingQuestion}
                    className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
                  >
                    {loadingQuestion ? 'Loading…' : (current + 1 >= totalQuestions ? 'Finish' : 'Submit & Next')}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right column: compact progress summary */}
        <div>
          <div className="p-6 rounded-xl bg-white border shadow-sm">
            <h4 className="text-lg font-semibold mb-3">Progress</h4>
            <div className="text-sm text-gray-600 mb-2">Question {Math.min(current + 1, totalQuestions)} of {totalQuestions}</div>
            <div className="text-2xl font-bold text-indigo-600 mb-3">{Math.round((score / Math.max(1, totalQuestions)) * 100)}%</div>

            <div className="w-full h-3 bg-gray-100 rounded overflow-hidden flex mb-3">
              {Array.from({ length: totalQuestions }).map((_, i) => {
                const state = answers[i] ?? -1;
                const width = `${100 / totalQuestions}%`;
                const cls = state === 1 ? 'bg-green-500' : state === 0 ? 'bg-red-500' : 'bg-gray-300';
                return <div key={i} className={`${cls} h-3`} style={{ width }} />;
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Score</div>
              <div className="text-lg font-semibold">{score}</div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default Quiz;
