import Link from 'next/link';

export const metadata = { title: 'Projects' };

export default function ProjectsIndex() {
  // Placeholder static content; will be replaced by dynamic MDX loading later.
  const sample = [
    { slug: 'modern-build-pipeline', title: 'Modern Build Pipeline Overhaul', summary: 'Cut CI time 60% via caching & parallelization.' }
  ];
  return (
    <section className="py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">Curated case studies highlighting impact, metrics, and technical depth.</p>
      </header>
      <ul className="space-y-4">
        {sample.map(p => (
          <li key={p.slug} className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <h2 className="font-semibold"><Link href={`/projects/${p.slug}/`}>{p.title}</Link></h2>
            <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">{p.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
