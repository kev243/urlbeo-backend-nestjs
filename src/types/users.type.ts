import { Links } from './links.type';

export interface Users {
  id: string;
  email: string;
  isEmailVerified: boolean;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  // This can be replaced with a more specific type if needed
  createdAt: Date;
  updatedAt: Date;
}

export interface mockUser {
  id: 'user-123';
  email: 'user@example.com';
  isEmailVerified: true;
  username: 'john-doe';
  name: 'John Updated';
  bio: 'Senior Developer';
  avatarUrl: null;
  createdAt: '2025-01-01T00:00:00Z';
  updatedAt: '2025-01-15T10:30:00Z';
}
