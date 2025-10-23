import React from 'react';

const ProfilePage: React.FC = () => {
  const profile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'A passionate developer who loves building web applications.',
  };

  return (
    <div>
      <h2>Profile</h2>
      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Bio:</strong> {profile.bio}</p>
    </div>
  );
};

export default ProfilePage;
