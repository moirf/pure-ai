import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageWithSkeleton from '../ImageWithSkeleton';

type Project = { id: string; title: string; description?: string; img?: string; thumbnail?: string };

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: Project = await res.json();
        setProject(data);
      } catch (err) {
        console.error('Failed to load project data', err);
      }
    };
    load();
  }, [id]);

  if (!project) return <div>Project not found. <Link to="/projects">Back to projects</Link></div>;

  const localImg = `/projects/${project.id}/image.jpg`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">{project.title}</h2>
      <ImageWithSkeleton src={localImg} alt={project.title} className="w-full h-64 object-cover rounded mb-4" fallbackSrc={project.img} />
      <p className="text-gray-700">{project.description}</p>
      <div className="mt-4">
        <Link to="/projects" className="text-blue-600">Back to projects</Link>
      </div>
    </div>
  );
};

export default ProjectDetail;
