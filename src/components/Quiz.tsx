import React, { useState } from 'react';

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

const StepItem: React.FC<{ step: typeof steps[number]; active?: boolean; onClick?: () => void }> = ({ step, active, onClick }) => (
  <li
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
);

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]); // -1 = unanswered, 1 = correct, 0 = wrong
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  const activeStep = steps.find((s) => s.id === active) || steps[0];

  const startSet = () => {
    const setKey = activeStep.key;
    const setQs = QUESTION_SETS[setKey] || [];
    setQuestions(setQs);
    setAnswers(new Array(setQs.length).fill(-1));
    setCurrent(0);
    setScore(0);
    setStarted(true);
  };

  const handleChoice = (idx: number) => {
    if (!questions.length) return;
    // ignore if already answered
    if (answers[current] !== -1) return;

    const correct = questions[current].answer === idx;
    setAnswers((prev) => {
      const copy = [...prev];
      copy[current] = correct ? 1 : 0;
      return copy;
    });

    if (correct) setScore((s) => s + 1);

    const next = current + 1;
    if (next < questions.length) {
      setCurrent(next);
    } else {
      setStarted(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setScore(0);
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-extrabold text-center mb-8">Quiz yourself to get ahead ...</h3>

      <div className="grid grid-cols-1 md:[grid-template-columns:220px_1fr_300px] gap-6">
        {/* Left column - steps list */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <ul className="divide-y">
            {steps.map((s) => (
              <StepItem key={s.id} step={s} active={s.id === active} onClick={() => { setActive(s.id); reset(); }} />
            ))}
          </ul>
        </div>

        {/* Center card (details for the active set) */}
        <div>
          <InfoCard tone="green" title={activeStep.title}>
            {/* Segmented progress bar (green=correct, red=wrong, gray=unanswered) */}
            <div className="mb-4">
              <div className="w-full h-3 bg-gray-100 rounded overflow-hidden flex">
                {questions.length === 0 && (
                  <div className="w-full h-3 bg-gray-200" />
                )}
                {questions.length > 0 && answers.length === questions.length && (
                  questions.map((_, i) => {
                    const state = answers[i];
                    const width = `${100 / questions.length}%`;
                    const cls = state === 1 ? 'bg-green-500' : state === 0 ? 'bg-red-500' : 'bg-gray-300';
                    return <div key={i} className={`${cls} h-3`} style={{ width }} />;
                  })
                )}
                {questions.length > 0 && answers.length !== questions.length && (
                  // show answered segments and the rest as gray
                  questions.map((_, i) => {
                    const state = answers[i] ?? -1;
                    const width = `${100 / questions.length}%`;
                    const cls = state === 1 ? 'bg-green-500' : state === 0 ? 'bg-red-500' : 'bg-gray-300';
                    return <div key={i} className={`${cls} h-3`} style={{ width }} />;
                  })
                )}
              </div>
            </div>

            <p className="mb-4">{getDescriptionForKey(activeStep.key)}</p>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <Avatar initials="MI" color="bg-white border" />
                <Avatar initials="AB" color="bg-white border" />
                <Avatar initials="JS" color="bg-white border" />
              </div>
            </div>

            <div className="mt-6">
              {!started ? (
                <div className="flex gap-2">
                  <button onClick={startSet} className="px-4 py-2 bg-blue-600 text-white rounded">Start Set</button>
                  <button onClick={() => alert('Preview learning content')} className="px-3 py-2 border rounded">Preview</button>
                </div>
              ) : (
                <div className="text-sm text-gray-700">In progress — question {current + 1} / {questions.length}</div>
              )}
            </div>
          </InfoCard>
        </div>

        {/* Right card (progress / learn) */}
        <div>
          <InfoCard tone="purple" title="Progress & Learn">
            <p className="mb-4">Track your progress and get suggested courses tailored to this set.</p>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center">IMG</div>
              <div className="flex-1">
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Suggested time</div>
                  <div className="text-lg font-semibold text-indigo-600">10m</div>
                </div>
                <div className="mt-3">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded">Learn</button>
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Inline quiz UI — appears when started */}
      {started && questions.length > 0 && (
        <div className="mt-8 max-w-3xl mx-auto bg-white p-6 rounded shadow">
          <div className="text-sm text-gray-600 mb-2">Set: <strong>{activeStep.title}</strong></div>
          <div className="text-lg font-semibold mb-4">{questions[current].text}</div>

          <div className="grid gap-3">
            {questions[current].choices.map((c, i) => (
              <button key={i} onClick={() => handleChoice(i)} className="text-left px-4 py-3 border rounded hover:bg-gray-100">
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Score: {score}</div>
            <div className="flex gap-2">
              <button onClick={reset} className="px-3 py-2 border rounded">Stop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
