export const metadata = { title: 'Open Source' };

import { siteConfig } from '../../config/site';

export default function OSSPage() {
  const items = siteConfig.oss;
  return (
    <section className="py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Open Source</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">Selected repositories and contributions.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map(i => (
          <li key={i.name} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold"><a className="hover:underline" href={i.url} target="_blank" rel="noopener noreferrer">{i.name}</a></h2>
            <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">{i.description}</p>
            <div className="text-xs mt-3 text-neutral-500 flex items-center gap-2">{i.stars !== undefined && <span>⭐ {i.stars}</span>} {i.highlight && <span className="px-1.5 py-0.5 rounded bg-brand/10 text-brand text-[10px] uppercase tracking-wide">Highlight</span>}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
