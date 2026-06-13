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
