import React from 'react';
import { Link } from 'react-router-dom';

interface Profile {
  name: string;
  headline: string;
  bio: string;
}

const HomePage: React.FC = () => {
  const profile: Profile = {
    name: 'John Doe',
    headline: 'Full-Stack Developer',
    bio: 'I am a passionate developer with experience in building scalable web applications.',
  };

  return (
    <main className="prose mx-auto p-8">
      <h1 className="text-4xl font-bold">{profile.name}</h1>
      <h2 className="text-2xl text-gray-600">{profile.headline}</h2>
      <p className="text-lg text-gray-800">{profile.bio}</p>
      <section>
        <h3 className="text-xl font-semibold">Explore</h3>
        <ul className="list-disc pl-5">
          <li>
            <Link to="/projects" className="text-blue-500 hover:underline">
              Projects
            </Link>
          </li>
          <li>
            <Link to="/galleries" className="text-blue-500 hover:underline">
              Photo Galleries
            </Link>
          </li>
          <li>
            <Link to="/quiz" className="text-blue-500 hover:underline">
              Take a Quiz
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
};

export default HomePage;
