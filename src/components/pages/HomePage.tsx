import React from 'react';
import { Link } from 'react-router-dom';
import ProfileLayout from '../ProfileLayout';

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
    <main className="mx-auto p-8 max-w-4xl">
      <ProfileLayout name={profile.name} title={profile.headline} bio={profile.bio}>
        <section>
          <h3 className="text-xl font-semibold">Explore</h3>
          <ul className="list-disc pl-5 mt-2">
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
      </ProfileLayout>
    </main>
  );
};

export default HomePage;
