import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

type Project = { id: string; title: string; description?: string; img?: string; thumbnail?: string };

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/projects/projects.json');
        const data: Project[] = await res.json();
        const found = data.find((p) => p.id === id) || null;
        setProject(found);
      } catch (err) {
        console.error('Failed to load project data', err);
      }
    };
    load();
  }, [id]);

  if (!project) return <div>Project not found. <Link to="/projects">Back to projects</Link></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">{project.title}</h2>
      <img src={project.img} alt={project.title} className="w-full h-64 object-cover rounded mb-4" loading="lazy" />
      <p className="text-gray-700">{project.description}</p>
      <div className="mt-4">
        <Link to="/projects" className="text-blue-600">Back to projects</Link>
      </div>
    </div>
  );
};

export default ProjectDetail;
