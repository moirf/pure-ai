import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export const metadata = { title: 'Projects' };

interface ProjectMeta { slug: string; title: string; summary?: string; dateStart?: string; dateEnd?: string; }

function loadProjects(): ProjectMeta[] {
  const dir = path.join(process.cwd(), 'content', 'projects');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(filename => {
      const slug = filename.replace(/\.mdx$/, '');
      const src = fs.readFileSync(path.join(dir, filename), 'utf8');
      const { data } = matter(src);
      return {
        slug,
        title: data.title || slug,
        summary: data.summary || data.highlights?.[0] || '',
        dateStart: data.dateStart,
        dateEnd: data.dateEnd
      } as ProjectMeta;
    })
    .sort((a,b) => (b.dateStart||'').localeCompare(a.dateStart||''));
}

export default function ProjectsIndex() {
  const projects = loadProjects();
  return (
    <section className="py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">Curated case studies highlighting impact, metrics, and technical depth.</p>
      </header>
      <ul className="space-y-4">
        {projects.map(p => (
          <li key={p.slug} className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <h2 className="font-semibold"><Link href={`/projects/${p.slug}/`}>{p.title}</Link></h2>
            {p.summary && <p className="text-sm mt-1 text-neutral-600 dark:text-neutral-400">{p.summary}</p>}
            {(p.dateStart || p.dateEnd) && (
              <p className="text-xs mt-2 text-neutral-500">{p.dateStart} – {p.dateEnd || 'Present'}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
