import React from 'react';

type Step = { id: number; title: string; icon: string; key: string };

const StepItem = React.forwardRef<HTMLLIElement, { step: Step; active?: boolean; onClick?: () => void }>(
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

export const StepList: React.FC<{
  steps: Step[];
  activeId: number;
  onStepClick: (id: number) => void;
  leftListRef: React.RefObject<HTMLUListElement>;
  setStepRef: (index: number, el: HTMLLIElement | null) => void;
}> = ({ steps, activeId, onStepClick, leftListRef, setStepRef }) => {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <ul className="divide-y" ref={leftListRef}>
        {steps.map((s, i) => (
          <StepItem
            key={s.id}
            step={s}
            active={s.id === activeId}
            ref={(el) => setStepRef(i, el)}
            onClick={() => onStepClick(s.id)}
          />
        ))}
      </ul>
    </div>
  );
};

export default StepList;
