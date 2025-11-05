import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Quiz from './components/Quiz';
import HomePage from './components/pages/HomePage';
import GalleriesPage from './components/pages/GalleriesPage';
import ProfilePage from './components/pages/ProfilePage';
import ProjectsPage from './components/pages/ProjectsPage';
import ProjectDetail from './components/pages/ProjectDetail';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div>
      <Header />

      <main className="py-6">
        <div className="max-w-6xl mx-auto px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/galleries" element={<GalleriesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
