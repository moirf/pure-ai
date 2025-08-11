export const metadata = { title: 'Experience' };

export default function ExperiencePage() {
  const roles = [
    { company: 'Example Corp', role: 'Senior Software Engineer', period: '2022 → 2024', achievements: ['Led migration reducing infra cost 25%', 'Introduced error budget policy lowering incidents 35%'] }
  ];
  return (
    <section className="py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Experience</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">Professional roles and key achievements.</p>
      </header>
      <div className="space-y-6">
        {roles.map(r => (
          <div key={r.company} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold">{r.role} · {r.company}</h2>
            <div className="text-xs uppercase tracking-wide mt-1 text-neutral-500">{r.period}</div>
            <ul className="mt-3 list-disc list-inside text-sm space-y-1 text-neutral-700 dark:text-neutral-300">
              {r.achievements.map(a => <li key={a}>{a}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
