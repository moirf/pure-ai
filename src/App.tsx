import React, { useState } from 'react';
import HomePage from './components/pages/HomePage';
import Quiz from './components/Quiz';
import GalleriesPage from './app/galleries/page';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'quiz' | 'galleries'>('home');

  return (
    <div>
      <h1>Developer Profile</h1>
      <nav>
        <button onClick={() => setCurrentPage('home')}>Home</button>
        <button onClick={() => setCurrentPage('quiz')}>Quiz</button>
        <button onClick={() => setCurrentPage('galleries')}>Photo Galleries</button>
      </nav>
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'quiz' && <Quiz />}
      {currentPage === 'galleries' && <GalleriesPage />}
    </div>
  );
};

export default App;
