export interface ResponsePublicUserByUsername {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  links: Link[] | null;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  position: number;
}
