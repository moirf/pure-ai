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
}

export const siteConfig: SiteConfig = {
  siteName: 'moirf.works',
  domain: 'moirf.works',
  contact: {
    email: 'you@example.com',
    github: 'your-handle',
    linkedin: 'your-linkedin-handle',
    location: 'Remote'
  },
  oss: [
    {
      name: 'sample-repo',
      description: 'Example contribution or maintained repo',
      url: 'https://github.com/your-handle/sample-repo',
      stars: 120,
      highlight: true
    }
  ]
};

export function obfuscateEmail(email: string) {
  // Basic obfuscation: replace symbols; you can enhance later.
  return email.replace('@', ' [at] ').replace(/\./g, ' [dot] ');
}
