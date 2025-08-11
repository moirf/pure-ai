export const metadata = { title: 'Blog' };

export default function BlogIndex() {
  const posts: { slug: string; title: string; date: string; excerpt: string }[] = [
    { slug: 'scaling-ci', title: 'Scaling CI for Rapid Teams', date: '2025-01-12', excerpt: 'Lessons learned cutting pipeline time...' }
  ];
  return (
    <section className="py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">Long-form articles and engineering notes.</p>
      </header>
      <ul className="space-y-6">
        {posts.map(p => (
          <li key={p.slug} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h2 className="font-semibold text-lg"><a href={`/blog/${p.slug}/`}>{p.title}</a></h2>
            <div className="text-xs text-neutral-500 mt-1">{p.date}</div>
            <p className="text-sm mt-2 text-neutral-700 dark:text-neutral-300">{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
