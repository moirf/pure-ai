"use client";
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') as 'light' | 'dark' | null : null;
    if (stored) setTheme(stored);
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
