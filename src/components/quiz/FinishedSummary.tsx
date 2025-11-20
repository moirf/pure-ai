import React from 'react';

export const FinishedSummary: React.FC<{
  answers: number[];
  score: number;
  total: number;
  onRetry: () => void;
  onRetake: () => void;
}> = ({ answers, score, total, onRetry, onRetake }) => {
  return (
    <div className="mt-6 bg-white p-6 rounded shadow w-full">
      <h3 className="text-xl font-semibold mb-2">Test Summary</h3>
      <p className="mb-4">You scored <span className="font-bold">{score}</span> of <span className="font-bold">{total}</span> ({Math.round((score / Math.max(1, total)) * 100)}%)</p>

      <div className="grid gap-2">
        {answers.map((a, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 border rounded">
            <div className="text-sm">Question {i + 1}</div>
            <div className={a === 1 ? 'text-green-600 font-semibold' : a === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
              {a === 1 ? 'Correct' : a === 0 ? 'Wrong' : 'Unanswered'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onRetry} className="px-4 py-2 border rounded">Retry</button>
        <button onClick={onRetake} className="px-4 py-2 bg-indigo-600 text-white rounded">Retake</button>
      </div>
    </div>
  );
};

export default FinishedSummary;
