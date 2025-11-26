import React, { useState, useRef, useEffect } from 'react';
import StepList from './quiz/StepList';
import QuestionPanel from './quiz/QuestionPanel';
import FinishedSummary from './quiz/FinishedSummary';
import ProgressPanel from './quiz/ProgressPanel';

type Question = {
  id?: string;
  text: string;
  choices: string[];
  // `answer` is optional because server does not send the correct answer to the client
  answer?: number;
};

type QuestionSet = {
  sno: number;
  questionId: string;
  correct?: boolean | null;
};

const steps = [
  { id: 1, title: 'CTET 2025', icon: '👑', key: 'ctet25' },
  { id: 2, title: 'CTET 2024', icon: '👑', key: 'ctet24' },
  { id: 3, title: 'GKT 2025', icon: '👑', key: 'gkt25' },
  { id: 4, title: 'Math Test', icon: '👑', key: 'math' },
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
    case 'ctet25':
      return 'To qualify candidates for teaching in Classes 1–8 in central government or CBSE-affiliated schools. Qualifying Marks: General: 60% (90/150) SC/ST/OBC: 55% (82/150)';
    case 'ctet24':
      return 'Interview readiness: practice common questions, portfolio presentation and storytelling.';
    case 'gkt25':
      return 'Compensation & negotiation: research, positioning, and building leverage.';
    case 'math':
      return 'Math fundamentals: arithmetic speed, accuracy, and reasoning drills.';
    default:
      return 'Sharpen your skills with curated practice sets and instant feedback.';
  }
}

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
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // We'll fetch one question at a time from the API.
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [currentOptionOrder, setCurrentOptionOrder] = useState<number[] | null>(null);
  const [questionSet, _setQuestionSet] = useState<QuestionSet[] | null>(null);
  const questionSetRef = useRef<QuestionSet[] | null>(null);
  const setQuestionSet = (next: QuestionSet[] | null) => {
    questionSetRef.current = next;
    _setQuestionSet(next);
  };
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [runtimeId, setRuntimeId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]); // -1 = unanswered, 1 = correct, 0 = wrong
  const [current, setCurrent] = useState(0); // index in the sequence 0..(total-1)
  const [score, setScore] = useState(0);
  const totalQuestions = 5;
  const [selected, setSelected] = useState<number | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingSet, setLoadingSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [presented, setPresented] = useState<Array<{ text: string; choices: string[]; selectedIndex?: number }>>([]);

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

  useEffect(() => {
    // Try to flush any pending results saved while offline or when server failed.
    try {
      flushPendingResults();
    } catch (e) {}
  }, []);

  // Initialize sessionId from localStorage so the quiz picks up the persisted session automatically
  useEffect(() => {
    try {
      const s = localStorage.getItem('sessionId');
      if (s) setSessionId(s);
    } catch (e) {}
  }, []);

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
      setStartedAt(Date.now());
      setPresented([]);
      setQuestionSet(null);
      if (!sessionId) {
        setError('A sessionId is required. Please set a Session ID in the header before starting.');
        setStarted(false);
        setLoadingSet(false);
        return;
      }

      let newQuizId: string | null = quizId;
      let initialQuestionSet: QuestionSet[] | null = null;
      let bootstrapSession: { runtimeId?: string | null } | null = null;
      const allocation = { [activeStep.key]: totalQuestions } as Record<string, number>;
      try {
        const createRes = await fetch('/api/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, metadata: { stepKey: activeStep.key, totalQuestions, allocation } })
        });
        if (createRes.ok) {
          const createJson = await createRes.json();
          newQuizId = createJson.quizId ?? null;
          setQuizId(newQuizId);
          if (Array.isArray(createJson.questionSet)) {
            initialQuestionSet = createJson.questionSet as QuestionSet[];
            setQuestionSet(initialQuestionSet);
          }
          if (createJson.session && typeof createJson.session.runtimeId === 'string') {
            bootstrapSession = createJson.session;
            setRuntimeId(createJson.session.runtimeId);
          }
        } else {
          console.warn('Failed to create quiz on server', createRes.status);
        }
      } catch (e) {
        console.warn('Failed to create quiz', e);
      }

      const runtimeToken = bootstrapSession?.runtimeId ?? null;
      if (!runtimeToken) {
        throw new Error('Failed to establish a runtime session for this quiz. Please try again.');
      }
      if (!initialQuestionSet && newQuizId) {
        await refreshQuestionSet(newQuizId);
      }
      setRuntimeId(runtimeToken);
      await fetchQuestion(0);
    } catch (err: any) {
      console.error('startSet error', err);
      setError(String(err?.message ?? err));
      setStarted(false);
      setRuntimeId(null);
    } finally {
      setLoadingSet(false);
    }
  };

  async function fetchQuestion(index: number) {
    setLoadingQuestion(true);
    setError(null);
    setCurrentQuestionId(null);
    setCurrentOptionOrder(null);
    try {
      const runtimeToken = runtimeId;
      if (!runtimeToken) {
        setError('Runtime session is no longer available. Ending quiz.');
        setStarted(false);
        setCurrentQuestion(null);
        return;
      }

      const res = await fetch(`/api/questions?session=${encodeURIComponent(runtimeToken)}&index=${index}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const q = data.question || data;
      if (!q) throw new Error('No question returned from quiz');
      const parsed: Question = {
        id: q.id,
        text: q.text || q.question || 'Untitled',
        choices: Array.isArray(q.options) ? q.options : q.choices || [],
        answer: undefined,
      };
      const optionOrder = Array.isArray(q.optionOrder) ? q.optionOrder.map((value: number) => Number(value)) : parsed.choices.map((_, idx) => idx);
      setCurrentQuestionId(parsed.id ?? null);
      setCurrentOptionOrder(optionOrder);
      setRuntimeId((prev) => prev || data.runtimeId || runtimeToken);
      setCurrentQuestion(parsed);
      setSelected(null);
      setPresented((p) => { const copy = [...p]; copy[index] = { text: parsed.text, choices: parsed.choices }; return copy; });
      return;
    } catch (err: any) {
      // fallback: pick a random question from local set
      console.warn('Failed to fetch question, falling back to local sample:', err?.message || err);
      const local = QUESTION_SETS[activeStep.key] || [];
      const pick = local.length ? local[index % local.length] : { text: 'Fallback question', choices: ['A', 'B', 'C'], answer: 0 };
      setCurrentQuestionId(null);
      setCurrentOptionOrder(pick.choices?.map((_: any, idx: number) => idx) ?? null);
      setCurrentQuestion(pick);
      setError(err?.message ? String(err.message) : 'Failed to fetch question');
    } finally {
      setLoadingQuestion(false);
    }
  }

  const handleSelect = (idx: number) => {
    if (!currentQuestion) return;
    // Allow changing selection until the user submits. Toggle if same index clicked again.
    if (selected === idx) {
      setSelected(null);
    } else {
      setSelected(idx);
    }
  };
  const handleSubmitAnswer = async () => {
    if (selected === null || !currentQuestion) return;

    // Validate answer (server or client)
    let isCorrect = false;
    const canonicalIndex = Array.isArray(currentOptionOrder) && currentOptionOrder[selected] !== undefined ? currentOptionOrder[selected] : selected;
    const runtimeToken = runtimeId;
    if (!runtimeToken) {
      setError('Runtime session expired. Ending quiz.');
      setStarted(false);
      setCurrentQuestion(null);
      return;
    }
    try {
      const validateUrl = `/api/questions/${encodeURIComponent(runtimeToken)}/validate?index=${current}`;
      const res = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIndex: canonicalIndex })
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      isCorrect = !!data.correct;
    } catch (err) {
      console.warn('Validation failed, ending quiz', err);
      setError('Failed to validate answer. Please restart the quiz.');
      setStarted(false);
      setCurrentQuestion(null);
      return;
    }

    const updatedAnswers = [...answers];
    updatedAnswers[current] = isCorrect ? 1 : 0;
    setAnswers(updatedAnswers);
    setPresented((p) => {
      const copy = [...p];
      copy[current] = Object.assign(copy[current] || {}, { selectedIndex: selected });
      return copy;
    });
    const updatedScore = isCorrect ? score + 1 : score;
    setScore(updatedScore);

    const next = current + 1;
    if (next < totalQuestions) {
      setCurrent(next);
      await fetchQuestion(next);
      return;
    }

    // finished
    setStarted(false);
    setCurrentQuestion(null);
    setFinished(true);

    // Save results to server if we have a quizId; if that fails, persist locally for retry
    if (!quizId) return;

    const finishedAt = Date.now();
    const durationMs = startedAt ? (finishedAt - startedAt) : undefined;
    const total = updatedAnswers.length;
    const percent = Math.round((updatedScore / Math.max(1, total)) * 100);
    const summary = { score: updatedScore, total, percent, durationMs, startedAt, finishedAt };
    const payload = { quizId, answers: updatedAnswers, summary, quizType: activeStep.key, presented };

    try {
      const finishUrl = `/api/quizzes/${encodeURIComponent(quizId)}/finish`;
      const res = await fetch(finishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
    } catch (e) {
      try {
        const key = 'pendingQuizResults';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(payload);
        localStorage.setItem(key, JSON.stringify(existing));
        console.warn('Saved quiz result to localStorage pending queue', e);
      } catch (le) {
        console.warn('Failed to persist pending quiz result', le);
      }
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrentQuestion(null);
    setAnswers([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setQuizId(null);
    setQuestionSet(null);
  };

  async function refreshQuestionSet(currentQuizId: string | null) {
    if (!currentQuizId) return null;
    try {
      const res = await fetch(`/api/quizzes/${encodeURIComponent(currentQuizId)}`);
      if (!res.ok) return null;
      const quizData = await res.json();
      if (Array.isArray(quizData.questions)) {
        setQuestionSet(quizData.questions);
        return quizData.questions as QuestionSet[];
      }
      return null;
    } catch (err) {
      console.warn('Failed to load question set for quiz', currentQuizId, err);
      return null;
    }
  }

  // Flush any pending quiz results stored in localStorage. Called on mount.
  async function flushPendingResults() {
    try {
      const key = 'pendingQuizResults';
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const arr = JSON.parse(raw) as any[];
      if (!Array.isArray(arr) || arr.length === 0) return;
      const remaining: any[] = [];
      for (const item of arr) {
        try {
          if (!item?.quizId) throw new Error('quizId missing on pending payload');
          const finishUrl = `/api/quizzes/${encodeURIComponent(item.quizId)}/finish`;
          const res = await fetch(finishUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
        } catch (e) {
          remaining.push(item);
        }
      }
      if (remaining.length > 0) localStorage.setItem(key, JSON.stringify(remaining));
      else localStorage.removeItem(key);
    } catch (err) {
      console.warn('flushPendingResults failed', err);
    }
  }

  return (
    <div className="w-full px-6 md:px-10">
      <div className="grid grid-cols-1 md:[grid-template-columns:2fr_8fr_2fr] gap-6">
        {/* Left column - steps list */}
        <StepList
          steps={steps}
          activeId={active}
          onStepClick={(id) => {
            setActive(id);
            reset();
          }}
          leftListRef={leftListRef}
          setStepRef={(i, el) => (stepRefs.current[i] = el)}
        />

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
            <QuestionPanel
              question={currentQuestion}
              selected={selected}
              onSelect={handleSelect}
              onSubmit={handleSubmitAnswer}
              loadingQuestion={loadingQuestion}
              current={current}
              total={totalQuestions}
              score={score}
            />
          )}

              {/* Finished summary view */}
              {finished && (
                <FinishedSummary answers={answers} score={score} total={totalQuestions} onRetry={reset} onRetake={() => { reset(); startSet(); }} />
              )}

        </div>

        <ProgressPanel answers={answers} current={current} total={totalQuestions} score={score} />
      </div>

      
    </div>
  );
};

export default Quiz;
