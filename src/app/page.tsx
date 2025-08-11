
import Link from 'next/link';
import getConfig from 'next/config';
const basePath = (getConfig().publicRuntimeConfig && getConfig().publicRuntimeConfig.basePath) || '';

export default function HomePage() {
  return (
    <section className="space-y-10 py-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Hi, I’m <span className="text-brand">Your Name</span>.</h1>
        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-300">I build performant, accessible web platforms and developer tooling. This site hosts selected projects, experience, and writing.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold">Projects</h2>
          <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">Impact-focused case studies highlighting outcomes.</p>
          <Link className="text-sm mt-2 inline-block text-brand hover:underline" href={`${basePath}/projects/`}>View Projects →</Link>
        </div>
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold">Experience</h2>
          <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">Roles, responsibilities, and achievements timeline.</p>
          <Link className="text-sm mt-2 inline-block text-brand hover:underline" href={`${basePath}/experience/`}>View Experience →</Link>
        </div>
        <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold">Writing</h2>
            <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">Articles & notes on performance, DX, and automation.</p>
          <Link className="text-sm mt-2 inline-block text-brand hover:underline" href={`${basePath}/blog/`}>View Blog →</Link>
        </div>
      </div>
    </section>
  );
}
