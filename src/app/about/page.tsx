import { siteConfig } from '../../config/site';
import Link from 'next/link';

export const metadata = { title: 'About' };

export default function AboutPage() {
  const { ownerName, headline, summary, contact } = siteConfig;
  return (
    <section className="py-8 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <p className="text-lg font-medium">{ownerName} — {headline}</p>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{summary}</p>
      <div className="space-y-2 pt-4">
        <h2 className="font-semibold">Links</h2>
        <ul className="list-disc list-inside text-sm">
          <li><a className="text-brand hover:underline" href={`mailto:${contact.email}`}>Email</a></li>
          <li><a className="text-brand hover:underline" href={`https://github.com/${contact.github}`}>GitHub</a></li>
          {contact.linkedin && <li><a className="text-brand hover:underline" href={contact.linkedin}>LinkedIn</a></li>}
        </ul>
      </div>
      <div className="pt-6 text-sm">
        <Link className="text-brand hover:underline" href="/projects/">View Projects →</Link>
      </div>
    </section>
  );
}
