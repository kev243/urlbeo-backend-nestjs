export interface Users {
  id: string;
  email: string;
  isEmailVerified: boolean;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
