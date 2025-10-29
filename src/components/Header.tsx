import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { CommandButton } from '@fluentui/react';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    // sticky ensures the header stays at the top; z-index keeps it above content
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-nowrap">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="text-xl font-bold shrink-0">Free Learning</Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex gap-3 text-sm text-gray-700 flex-nowrap overflow-x-auto">
            
            <Link to="/" className="hover:underline whitespace-nowrap">Home</Link>
            <Link to="/quiz" className="hover:underline whitespace-nowrap">Take Quiz</Link>
            <Link to="/projects" className="hover:underline whitespace-nowrap">Projects</Link>
            <Link to="/galleries" className="hover:underline whitespace-nowrap">Galleries</Link>

            <Link to="/profile" className="hover:underline whitespace-nowrap">Profile</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />

          {/* Mobile hamburger */}
              <CommandButton
            className="sm:hidden"
            iconProps={{ iconName: open ? 'ChromeClose' : 'GlobalNavButton' }}
            title={open ? 'Close menu' : 'Open menu'}
            ariaLabel={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((s) => !s)}
              />
        </div>
      </div>

      {/* Mobile menu */}
        <div className={`sm:hidden border-t bg-white transition-all duration-200 overflow-hidden ${open ? 'max-h-96 py-3' : 'max-h-0'}`}>
          <div className="max-w-6xl mx-auto px-4 flex flex-col gap-2">
            <Link to="/" onClick={() => setOpen(false)} className="hover:underline py-2">Home</Link>
            <Link to="/projects" onClick={() => setOpen(false)} className="hover:underline py-2">Projects</Link>
            <Link to="/galleries" onClick={() => setOpen(false)} className="hover:underline py-2">Galleries</Link>
            <Link to="/quiz" onClick={() => setOpen(false)} className="hover:underline py-2">Quiz</Link>
            <Link to="/profile" onClick={() => setOpen(false)} className="hover:underline py-2">Profile</Link>
          </div>
        </div>
    </header>
  );
};

export default Header;
