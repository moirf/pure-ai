import React from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
  const profile = {
    name: 'John Doe',
    headline: 'Full-Stack Developer',
    bio: 'I am a passionate developer with experience in building scalable web applications.',
  };

  return (
    <main className="prose mx-auto p-8">
      <h1>{profile.name}</h1>
      <h2>{profile.headline}</h2>
      <p>{profile.bio}</p>
      <section>
        <h3>Explore</h3>
        <ul>
          <li>
            <Link href="/projects">Projects</Link>
          </li>
          <li>
            <Link href="/galleries">Photo Galleries</Link>
          </li>
          <li>
            <Link href="/quiz">Take a Quiz</Link>
          </li>
        </ul>
      </section>
    </main>
  );
};

export default HomePage;
