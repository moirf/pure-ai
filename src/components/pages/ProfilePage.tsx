import React from 'react';

// Minimal markdown -> HTML converter for simple resume rendering.
function mdToHtml(md: string) {
  // Escape HTML
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  for (let line of lines) {
    if (!line.trim()) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push('');
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      if (inList) { out.push('</ul>'); inList = false; }
      const level = h[1].length;
      out.push(`<h${level}>${esc(h[2])}</h${level}>`);
      continue;
    }

    // Unordered lists
    const li = line.match(/^\s*[-*+]\s+(.*)/);
    if (li) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${esc(li[1])}</li>`);
      continue;
    }

    // Simple paragraphs
    out.push(`<p>${esc(line)}</p>`);
  }

  if (inList) out.push('</ul>');
  return out.join('\n');
}

const ProfilePage: React.FC = () => {

  // Summarized profile data derived from the resume
  const profile = {
    name: 'Mohammad Irfan',
    title: 'Senior Project Manager',
    bio: `Senior Project Manager with 20+ years in software development and 10+ years leading programs for enterprise clients including Microsoft. Skilled at program delivery, stakeholder management, and cost reduction through cloud migrations and DevOps practices. Proven track record improving operational efficiency, reducing release cycles, and leading cross-functional teams to deliver measurable business value.`,
    highlights: [
      '20+ years software development experience; 10+ years in project/program management',
      'Led cloud migrations and cost reductions (up to 90% infra cost savings)',
      'Improved incident handling and release cycles via automation and CI/CD',
      'Delivered multi-track programs for enterprise customers (Microsoft, Merck, InVision)',
    ],
    topSkills: ['Project Management', 'Azure & Cloud', 'CI/CD & DevOps', 'Stakeholder Management', 'Team Leadership'],
  };

  return (
    <div className="mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: main resume card (span 2 on md) */}
        <div className="md:col-span-2">
          <div className="relative bg-white rounded-lg shadow p-6">
            {/* Resume Score badge */}
            <div className="absolute -top-4 left-6">
              <div className="flex items-center gap-3 bg-white border rounded-full px-4 py-2 shadow">
                <div className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">81%</div>
                <div className="text-sm text-gray-700">Resume Score</div>
              </div>
            </div>

            <div className="prose max-w-none mt-6">
              <div dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
            </div>

            {/* AI coach prompt (sticky-ish at bottom) */}
            <div className="mt-6">
              <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">🔮</div>
                <input
                  placeholder="Ask AI coach anything..."
                  className="flex-1 px-3 py-2 border rounded focus:outline-none"
                />
                <button className="px-4 py-2 bg-indigo-600 text-white rounded">Ask</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <aside className="md:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
              <div className="-mt-16 mb-3">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center text-2xl font-bold">MI</div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{profile.name}</h3>
                <p className="text-sm text-gray-600">{profile.title}</p>
              </div>

              <div className="mt-4 w-full">
                <div className="flex items-center justify-between">
                  <div className="px-3 py-2 bg-indigo-50 rounded text-sm">ATS Perfect</div>
                  <button className="px-3 py-1 text-sm bg-white border rounded">+ Add skill</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-semibold mb-2">Contact</h4>
              <div className="text-sm text-gray-700">
                <div>X: x.com/moirfx</div>
                <div className="mt-1">Phone: (773) 489-3264</div>
                <div className="mt-1">Location: Chicago, IL</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-sm font-semibold mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {profile.topSkills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
