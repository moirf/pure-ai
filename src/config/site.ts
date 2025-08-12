export interface ContactInfo {
  email: string;            // plain email address (will be obfuscated in UI)
  github: string;           // github username
  linkedin?: string;        // linkedin handle or full URL
  twitter?: string;         // twitter/x handle
  location?: string;
}

export interface OSSRepo {
  name: string;
  description: string;
  url: string;
  stars?: number; // optional static snapshot
  highlight?: boolean;
}

export interface SiteConfig {
  siteName: string;
  domain: string;
  contact: ContactInfo;
  oss: OSSRepo[];
  ownerName: string;
  headline: string;
  summary: string;
}

export const siteConfig: SiteConfig = {
  siteName: 'moirf.works',
  domain: 'moirf.works',
  ownerName: 'Mohammad Irfan',
  headline: 'Senior Technical Manager at HCLTech',
  summary: 'Senior Technical Manager at HCLTech, specializing in designing and delivering enterprise cloud solutions. Holds Microsoft certifications as an Azure Solutions Architect and DevOps Engineer Expert, with proven expertise in cloud architecture, automation, and end-to-end DevOps practices.',
  contact: {
    email: 'moirf8@gmail.com',
    github: 'moirf',
    linkedin: 'https://www.linkedin.com/in/moirf',
    location: 'Redmond, USA'
  },
  oss: [
    {
      name: 'pure-ai',
      description: 'Personal developer portfolio & static site (this project).',
      url: 'https://github.com/moirf/pure-ai',
      highlight: true
    },
    {
      name: 'oss-contributions',
      description: 'Selected open-source issue triage & patch contributions (placeholder).',
      url: 'https://github.com/moirf',
      highlight: false
    }
  ]
};

export function obfuscateEmail(email: string) {
  // Basic obfuscation: replace symbols; you can enhance later.
  return email.replace('@', ' [at] ').replace(/\./g, ' [dot] ');
}
