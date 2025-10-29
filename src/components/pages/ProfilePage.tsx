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
  const md = `Mohammad Irfan
Senior Project Manager | Driving Technical Excellence & Team Leadership

Professional Summary:
As a Senior Project Manager, I allocate 40% of my time to Project, Stakeholder, and Risk Management, proactively addressing challenges. I lead cross-functional teams to deliver complex projects on time, including the development and launch of several successful software services. I manage relationships with stakeholders, team members, and external partners to ensure project success. I monitor project progress and address issues and risks in a timely manner. I enhance team technical strengths by encouraging continuous learning and development 

Accomplishments:
•	Over 20 years of software development experience in various roles.
•	Over 10 years of Project Management experience with clients such as Microsoft, AMiON, Merck Manuals, and InVision.
•	Achieved an 80% improvement in IcM handling time by fine-tuning baselines and implementing automated scripts.
•	Reduced Release Cycle time by 80% through DevOps Continuous Integration and Continuous Delivery (CI/CD).
•	Reduced infrastructure costs by 90% by migrating On-premises infrastructure to Azure Cloud.
•	Achieved an additional 50% cost reduction through coexistence models of services on Azure VMs.
•	$20M value add to customers by providing options for third-party customers to move to Microsoft.
•	Led cross-functional teams to deliver complex projects on time.
•	Implemented Agile methodologies and processes to improve team collaboration and productivity.
•	Managed relationships with stakeholders, team members, and partners to ensure project success.
•	Collaborated with product management and engineering teams to define product roadmaps.
•	Monitored project progress and addressed issues and risks in a timely manner.
•	Assisted other teams in implementing best practices within the current program.
•	Enhanced team technical strengths by encouraging continuous learning and development 

Education and Certificates:
•	Master of Computer Science - MCA (AMU, Aligarh, India) – 82% Marks, Year – 2001 – 2004
•	Bachelor of Science (BSc Physics) (AMU, Aligarh, India) – 76% Marks, Year – 1998 – 2001
•	Microsoft Certified: Azure Solutions Architect, DevOps Engineer Expert, Security Engineer Associate

Employment History:
1.	HCL America Inc - Senior Project Manager | Jun 30th, 2025 - Present
2.	LTIMINDTREE Ltd. (US) - Director – Program & Program Management | Jun 6th, 2024 – Jun 27th, 2025
3.	HCL America Inc - Senior Technical Manager | Dec 31st, 2016 - Jun 5th, 2024
4.	HCLTech (India) - Technical Manager | Jul 19th, 2007 - Dec 30th, 2016
5.	ALS India Pvt Ltd. - Software Developer | Jul 18th, 2005 - July 17th, 2007

Technical Skills:
•	Management: Project Management, Scrum & Agile, Program Development, Customer Engagement, Risk Assessment, Tracking Progress, Stakeholder Management, Teams Training, Cross-Cultural Communication, Diversity Inclusion, Regulatory Compliance
•	Programming: Gen-AI, GitHub Copilot, NLP, OpenAI, C# .Net, C# .Net Core, Web Services, Web API, REST API, SQL Server, React JS, Python
•	DevOps: Build Pipelines, Continuous Integration, Continuous Delivery (CI/CD), Kubernetes, Azure Pipelines, Azure Releases, Gated Deployments, GitHub, GitHub Actions, GitLab, Feature Flags
•	Cloud: Azure Computes, Networks, Security Management, Identity Management, Teams App Development, Microsoft Team Room Development, Azure Communication Services Development
•	Tools: Visual Studio, Visual Studio Code, Visio, Postman, Http Analyzer, Wire Shark, Power BI, SQL SSRS, Power Apps, Teams Studio, Microsoft Tools for Development

Professional Experience:
Client: Microsoft Corporation via HCL America Inc. | Jun 30th, 2025 - Present
Role: Senior Project Management
Product: FastTrack 
Responsibilities:
•	Managing multiple Tracks for delivery along with the stakeholder management.
•	Review Tech Specs and sizing and release planning.
•	Security Compliance for S360 and Microsoft Defender.
•	Reviewing PRs and providing guidance to the team, unblocking impediments
•	Conducting scrum standup, sprint planning, review, and retrospective meetings
Client: Microsoft Corporation via LTIMINDTREE Ltd. | Jun 6th, 2024 – Jun 27th, 2025
Role: Director Program & Program Management
Product: Unified Action Tracker
Responsibilities:
•	Managing multiple Tracks for delivery along with the stakeholder management.
•	Review Tech Specs and sizing and release planning.
•	Security Compliance for S360 and Microsoft Defender.
•	Reviewing PRs and providing guidance to the team, unblocking impediments
•	Conducting scrum standup, sprint planning, review, and retrospective meetings

Client: Microsoft Corporation via HCLTech | Oct 2021 – Jun 5th, 2024
Role: Senior Technical Manager
Product: Microsoft Teams Rooms – Insights
Responsibilities:
•	Architecting the design of MTR Rooms APIs
•	Conducting security and performance reviews for the API
•	Designing scalability and infrastructure for IAC and release pipelines
•	Reviewing PRs and providing guidance to the team, unblocking impediments
•	Conducting scrum standup, sprint planning, review, and retrospective meetings
Product: Microsoft Azure Communication Services - ACS
Responsibilities:
•	Showcasing the capabilities of ACS to the public to increase visibility and usage
•	Publishing sample codes on GitHub for C# .Net, Python, Java, and JS
•	Adding automated frameworks for covering the ACS APIs
•	Providing support for Microsoft End customers to use the ACS SDKs
•	Setting up POCs to showcase the capabilities of ACS
•	Providing status updates to stakeholders and conducting business review meetings for feedback and adjustments

                             
---

*Generated from project data.*`;

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
                <div>Email: a.hart@email.com</div>
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
