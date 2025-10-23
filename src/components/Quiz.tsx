import React, { useEffect, useMemo, useState } from 'react';

type Question = {
  text: string;
  choices: string[];
  answer: number; // index of correct choice
};

const SAMPLE_QUESTIONS: Question[] = [
  {
    text: 'Which language is primarily used for styling web pages?',
    choices: ['HTML', 'Python', 'CSS', 'TypeScript'],
    answer: 2,
  },
  {
    text: 'Which of these is a React hook?',
    choices: ['useState', 'setState', 'componentDidMount', 'render'],
    answer: 0,
  },
  {
    text: 'What does HTTP stand for?',
    choices: ['HyperText Transfer Protocol', 'Hyperlink Transfer Program', 'HighText Transfer Protocol', 'Hypermedia Transfer Protocol'],
    answer: 0,
  },
];

const Quiz: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const total = questions.length;

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/questions');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // Basic validation/normalization
      const parsed: Question[] = (data || []).map((q: any) => ({
        text: q.text || q.question || 'Untitled',
        choices: q.choices || q.options || [],
        answer: typeof q.answer === 'number' ? q.answer : 0,
      }));
      if (parsed.length === 0) throw new Error('No questions returned');
      setQuestions(parsed);
      setStarted(true);
      setCurrent(0);
      setScore(0);
    } catch (err: any) {
      console.warn('Falling back to sample questions:', err?.message || err);
      // Fallback to sample questions on error
      setQuestions(SAMPLE_QUESTIONS);
      setStarted(true);
      setCurrent(0);
      setScore(0);
      setError(err?.message ? String(err.message) : 'Failed to load questions, using sample set.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = useMemo(() => questions[current], [questions, current]);

  useEffect(() => {
    // Prefetch sample questions as placeholder (no network) so Start feels snappy
    setQuestions((q) => (q.length ? q : []));
  }, []);

  const handleChoice = (choiceIndex: number) => {
    if (!currentQuestion) return;
    const correct = choiceIndex === currentQuestion.answer;
    if (correct) setScore((s) => s + 1);
    const next = current + 1;
    if (next < total) {
      setCurrent(next);
    } else {
      // finished
      setStarted(false);
    }
  };

  const restart = () => {
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setStarted(false);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Interactive Quiz</h2>

      {!started && (
        <div className="space-y-3">
          <p className="text-gray-700">Test your knowledge with a short quiz. Questions are fetched from the local API; a sample set will be used if the API is unavailable.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={fetchQuestions}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Start Quiz'}
            </button>
            <button
              className="px-3 py-2 border rounded text-gray-700"
              onClick={() => {
                setQuestions(SAMPLE_QUESTIONS);
                setStarted(true);
              }}
            >
              Try Sample
            </button>
          </div>
        </div>
      )}

      {started && currentQuestion && (
        <div>
          <div className="mb-2 text-sm text-gray-600">Question {current + 1} / {total}</div>
          <div className="p-4 bg-gray-50 rounded mb-4">
            <div className="text-lg font-semibold">{currentQuestion.text}</div>
          </div>

          <div className="grid gap-3">
            {currentQuestion.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(idx)}
                className="text-left px-4 py-3 border rounded hover:bg-gray-100"
              >
                {choice}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Score: {score}</div>
            <div className="w-1/2 bg-gray-200 h-2 rounded overflow-hidden">
              <div
                className="h-2 bg-green-500"
                style={{ width: `${total ? ((current + 1) / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {!started && total > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <p className="text-gray-700">You scored {score} out of {total}.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={fetchQuestions} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
            <button onClick={restart} className="px-4 py-2 border rounded">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
