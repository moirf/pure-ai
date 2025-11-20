import React from 'react';

type Question = { text: string; choices: string[] };

export const QuestionPanel: React.FC<{
  question: Question | null;
  selected: number | null;
  onSelect: (i: number) => void;
  onSubmit: () => void;
  loadingQuestion: boolean;
  current: number;
  total: number;
  score: number;
}> = ({ question, selected, onSelect, onSubmit, loadingQuestion, current, total, score }) => {
  if (!question) return null;
  return (
    <div className="mt-6 bg-white p-6 rounded shadow w-full">
      <div className="text-lg font-semibold mb-4">{question.text}</div>

      <div className="grid gap-3">
        {question.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`text-left px-4 py-3 border rounded hover:bg-gray-100 ${selected === i ? 'bg-indigo-50 border-indigo-400' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Score: {score}</div>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={selected === null || loadingQuestion}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loadingQuestion ? 'Loading…' : (current + 1 >= total ? 'Finish' : 'Submit & Next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
