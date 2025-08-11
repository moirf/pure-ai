import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Pure AI – Developer Portfolio',
  description: 'Developer career site showcasing projects, experience, and writing.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 transition-colors">
        <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="font-semibold text-lg">Pure AI</a>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/projects/" className="hover:underline">Projects</a>
            <a href="/experience/" className="hover:underline">Experience</a>
            <a href="/blog/" className="hover:underline">Blog</a>
            <a href="/oss/" className="hover:underline">OSS</a>
            <a href="/contact/" className="hover:underline">Contact</a>
            <ThemeToggle />
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 pb-16">
          {children}
        </main>
        <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-12 py-8 text-sm text-neutral-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <span>&copy; {new Date().getFullYear()} Pure AI</span>
            <div className="flex gap-4">
              <a href="https://github.com/" className="hover:text-neutral-700 dark:hover:text-neutral-300">GitHub</a>
              <a href="/rss.xml" className="hover:text-neutral-700 dark:hover:text-neutral-300">RSS</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
