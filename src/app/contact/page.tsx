export const metadata = { title: 'Contact' };

import { siteConfig, obfuscateEmail } from '../../config/site';

export default function ContactPage() {
  const { contact } = siteConfig;
  const emailObfuscated = obfuscateEmail(contact.email);
  return (
    <section className="py-8 space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Contact</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Reach out via the channels below. Email is lightly obfuscated to reduce spam.</p>
      </header>
      <ul className="space-y-3 text-sm">
        <li><strong>Email:</strong> <span data-email={emailObfuscated}>{emailObfuscated}</span></li>
        <li><strong>GitHub:</strong> <a className="text-brand hover:underline" href={`https://github.com/${contact.github}`} rel="noopener noreferrer">@{contact.github}</a></li>
        {contact.linkedin && (
          <li><strong>LinkedIn:</strong> <a className="text-brand hover:underline" href={`https://www.linkedin.com/in/${contact.linkedin}`} rel="noopener noreferrer">{contact.linkedin}</a></li>
        )}
        {contact.twitter && (
          <li><strong>Twitter:</strong> <a className="text-brand hover:underline" href={`https://twitter.com/${contact.twitter}`} rel="noopener noreferrer">@{contact.twitter}</a></li>
        )}
        {contact.location && (<li><strong>Location:</strong> {contact.location}</li>)}
      </ul>
    </section>
  );
}
