import React, { useState } from 'react';

const steps = [
  { id: 1, title: 'Get Noticed', icon: '✉️' },
  { id: 2, title: 'Get Hired', icon: '💼' },
  { id: 3, title: 'Get Paid More', icon: '💵' },
  { id: 4, title: 'Get promoted', icon: '👑' },
];

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

  return (
    <div className="w-full">
      <h2 className="text-3xl font-extrabold text-center mb-8">Every tool you need is here…</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - steps list */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <ul className="divide-y">
            {steps.map((s) => (
              <StepItem key={s.id} step={s} active={s.id === active} onClick={() => setActive(s.id)} />
            ))}
          </ul>
        </div>

        {/* Center card */}
        <InfoCard tone="green" title="Career Coaching">
          <p className="mb-6">Work 1-1 with an expert to expand your network, give better interviews and negotiate a higher salary.</p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <Avatar initials="MI" color="bg-white border" />
              <Avatar initials="AB" color="bg-white border" />
              <Avatar initials="JS" color="bg-white border" />
            </div>
          </div>
        </InfoCard>

        {/* Right card */}
        <InfoCard tone="purple" title="Future Learn">
          <p className="mb-4">Future proof yourself. Get the courses you need to grow. Accredited, certified and respected by employers.</p>

          <div className="mt-4 flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center">IMG</div>
            <div className="flex-1">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-500">Your progress</div>
                <div className="text-lg font-semibold text-indigo-600">23%</div>
              </div>
              <div className="mt-3">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded">Learn</button>
              </div>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
};

export default Quiz;
