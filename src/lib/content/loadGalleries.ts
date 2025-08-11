import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getGalleries() {
  const galleriesDir = path.join(process.cwd(), 'content', 'galleries');
  const files = fs.readdirSync(galleriesDir).filter(f => f.endsWith('.mdx'));
  return files.map(filename => {
    const filePath = path.join(galleriesDir, filename);
    const source = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(source);
    return {
      slug: filename.replace(/\.mdx$/, ''),
      title: data.title || filename.replace(/\.mdx$/, ''),
      description: data.description || '',
    };
  });
}

export function getGallery(slug: string) {
  const filePath = path.join(process.cwd(), 'content', 'galleries', `${slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(source);
  return { content, ...data };
}
