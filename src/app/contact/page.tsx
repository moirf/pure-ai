export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <section className="py-8 space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Contact</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Reach out via the channels below. Email is obfuscated to reduce spam.</p>
      </header>
      <ul className="space-y-3 text-sm">
        <li><strong>Email:</strong> <span data-email="you(at)example(dot)com">you [at] example [dot] com</span></li>
        <li><strong>GitHub:</strong> <a className="text-brand hover:underline" href="https://github.com/" rel="noopener noreferrer">@your-handle</a></li>
        <li><strong>LinkedIn:</strong> <a className="text-brand hover:underline" href="https://www.linkedin.com/in/" rel="noopener noreferrer">Profile</a></li>
      </ul>
    </section>
  );
}
