import { getGalleries } from '../../lib/content/loadGalleries';
import Link from 'next/link';


// This is a server component
export default function GalleriesPage() {
  const galleries: { slug: string; title: string; description?: string }[] = getGalleries();
  return (
    <main className="prose mx-auto p-8">
      <h1>Photo Galleries</h1>
      <ul>
        {galleries.map(g => (
          <li key={g.slug}>
            <Link href={`/galleries/${g.slug}`}>{g.title}</Link>
            <div className="text-sm text-gray-500">{g.description}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
