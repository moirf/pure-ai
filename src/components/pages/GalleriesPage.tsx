import React from 'react';
import { getGalleries } from '../../lib/content/loadGalleries';

const GalleriesPage: React.FC = () => {
  // For a client-side app we won't call getGalleries (it relies on process.cwd()).
  // Render a simple placeholder that the existing content loader can replace
  // when migrating to an SSR build. Keep this component minimal and safe for
  // the browser.
  return (
    <main className="prose mx-auto p-8">
      <h1 className="text-3xl font-bold">Photo Galleries</h1>
      <p className="text-gray-700">A collection of photo galleries will appear here.</p>
      <p className="text-sm text-gray-500">(Galleries are loaded from markdown files in the content/galleries folder on the server.)</p>
    </main>
  );
};

export default GalleriesPage;
