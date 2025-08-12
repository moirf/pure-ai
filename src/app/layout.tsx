
import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Learnfree – Developer Portfolio',
  description: 'Developer career site showcasing projects, experience, and writing.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 transition-colors">
        <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">Learn Free</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/projects/" className="hover:underline">Projects</Link>
            <Link href="/experience/" className="hover:underline">Experience</Link>
            <Link href="/blog/" className="hover:underline">Blog</Link>
            <Link href="/oss/" className="hover:underline">OSS</Link>
            <Link href="/contact/" className="hover:underline">Contact</Link>
            <ThemeToggle />
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 pb-16">
          {children}
        </main>
        <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-12 py-8 text-sm text-neutral-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <span>&copy; {new Date().getFullYear()} Developed mostly with GitHub Copilot</span>
            <div className="flex gap-4">
              <a href="https://github.com/moirf" className="hover:text-neutral-700 dark:hover:text-neutral-300">GitHub</a>
              <Link href="/rss.xml" className="hover:text-neutral-700 dark:hover:text-neutral-300">RSS</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
