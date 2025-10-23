import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const Header: React.FC = () => {
  return (
    // sticky ensures the header stays at the top; z-index keeps it above content
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-nowrap">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="text-xl font-bold shrink-0">Developer Profile</Link>
          <nav className="flex gap-3 text-sm text-gray-700 flex-nowrap overflow-x-auto">
            <Link to="/" className="hover:underline whitespace-nowrap">Home</Link>
            <Link to="/projects" className="hover:underline whitespace-nowrap">Projects</Link>
            <Link to="/galleries" className="hover:underline whitespace-nowrap">Galleries</Link>
            <Link to="/quiz" className="hover:underline whitespace-nowrap">Quiz</Link>
            <Link to="/profile" className="hover:underline whitespace-nowrap">Profile</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
