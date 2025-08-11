import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface ProjectFrontMatter {
  slug: string;
  title: string;
  summary: string;
  role?: string;
  dateStart?: string;
  dateEnd?: string;
  tags?: string[];
  stack?: string[];
}

const projectsDir = path.join(process.cwd(), 'content', 'projects');

export function loadProjects(): ProjectFrontMatter[] {
  return fs.readdirSync(projectsDir)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .map(file => {
      const raw = fs.readFileSync(path.join(projectsDir, file), 'utf8');
      const { data } = matter(raw);
      return data as ProjectFrontMatter;
    })
    .sort((a, b) => (b.dateStart || '').localeCompare(a.dateStart || ''));
}
