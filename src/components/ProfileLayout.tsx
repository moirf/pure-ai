import React from 'react';
import { Persona, PersonaSize, Stack, Text, Link as FluentLink } from '@fluentui/react';

type Contact = { label: string; href: string };
type Social = { label: string; href: string; icon?: React.ReactNode };
type Project = { title: string; description?: string; href?: string };

type Props = {
  name: string;
  title?: string;
  bio?: string;
  contacts?: Contact[];
  skills?: string[];
  social?: Social[];
  projects?: Project[];
  children?: React.ReactNode;
};

const ProfileLayout: React.FC<Props> = ({ name, title, bio, contacts = [], skills = [], social = [], projects = [], children }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <Stack horizontal horizontalAlign="start" verticalAlign="center" tokens={{ childrenGap: 16 }}>
        <Persona text={name} size={PersonaSize.size72} />

        <div className="min-w-0">
          <Text variant="xLargePlus" block className="font-bold truncate">{name}</Text>
          {title && <Text variant="small" block className="text-gray-600 truncate">{title}</Text>}
          {bio && <Text block className="mt-2 text-gray-700 max-w-xl">{bio}</Text>}

          {contacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {contacts.map((c, i) => (
                <FluentLink key={i} href={c.href} target="_blank" rel="noreferrer" className="text-sm">
                  {c.label}
                </FluentLink>
              ))}
            </div>
          )}

          {social.length > 0 && (
            <div className="mt-2 flex items-center gap-3">
              {social.map((s, i) => (
                <FluentLink key={i} href={s.href} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-2">
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </FluentLink>
              ))}
            </div>
          )}
        </div>
      </Stack>

      {skills.length > 0 && (
        <div className="mt-6">
          <Text variant="medium" block className="font-semibold mb-2">Skills</Text>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="px-2 py-1 text-sm bg-gray-100 rounded">{s}</span>
            ))}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-6">
          <Text variant="medium" block className="font-semibold mb-2">Projects</Text>
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p, i) => (
              <div key={i} className="p-4 border rounded bg-gray-50">
                <div className="font-semibold text-sm">{p.title}</div>
                {p.description && <div className="text-sm text-gray-600 mt-1">{p.description}</div>}
                {p.href && (
                  <FluentLink href={p.href} target="_blank" rel="noreferrer" className="text-blue-600 text-sm mt-2 inline-block">View</FluentLink>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default ProfileLayout;
