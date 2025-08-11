export const metadata = { title: 'Open Source' };

export default function OSSPage() {
  const items = [
    { name: 'sample-repo', description: 'Example contribution or maintained repo', stars: 120 }
  ];
  return (
    <section className="py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Open Source</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">Selected repositories and contributions.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map(i => (
          <li key={i.name} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold">{i.name}</h2>
            <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">{i.description}</p>
            <div className="text-xs mt-3 text-neutral-500">⭐ {i.stars}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
