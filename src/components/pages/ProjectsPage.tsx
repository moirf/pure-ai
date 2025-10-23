import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Project = { id: string; title: string; description?: string; img?: string; thumbnail?: string };

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/projects/projects.json');
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Projects</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="block border rounded overflow-hidden hover:shadow">
            <img src={p.thumbnail} alt={p.title} className="w-full h-40 object-cover" loading="lazy" />
            <div className="p-3 bg-white">
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-gray-600">{p.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
