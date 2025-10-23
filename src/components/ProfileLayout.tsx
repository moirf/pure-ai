import React from 'react';
import { Persona, PersonaSize } from '@fluentui/react';

type Props = {
  name: string;
  title?: string;
  bio?: string;
  children?: React.ReactNode;
};

const ProfileLayout: React.FC<Props> = ({ name, title, bio, children }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex gap-6 items-center">
        <Persona text={name} size={PersonaSize.size72} />
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {title && <div className="text-sm text-gray-600">{title}</div>}
          {bio && <p className="mt-2 text-gray-700 max-w-xl">{bio}</p>}
        </div>
      </div>

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default ProfileLayout;
