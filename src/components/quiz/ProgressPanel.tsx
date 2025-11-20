import React from 'react';

export const ProgressPanel: React.FC<{ answers: number[]; current: number; total: number; score: number }> = ({ answers, current, total, score }) => {
  return (
    <div>
      <div className="p-6 rounded-xl bg-white border shadow-sm">
        <h4 className="text-lg font-semibold mb-3">Progress</h4>
        <div className="text-sm text-gray-600 mb-2">Question {Math.min(current + 1, total)} of {total}</div>
        <div className="text-2xl font-bold text-indigo-600 mb-3">{Math.round((score / Math.max(1, total)) * 100)}%</div>

        <div className="w-full h-3 bg-gray-100 rounded overflow-hidden flex mb-3">
          {Array.from({ length: total }).map((_, i) => {
            const state = answers[i] ?? -1;
            const width = `${100 / total}%`;
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
  );
};

export default ProgressPanel;
