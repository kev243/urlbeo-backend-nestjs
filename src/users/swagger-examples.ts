/**
 * Swagger/OpenAPI examples for Users API responses
 */

export const userExamples = {
  // Complete user profile with all fields populated
  complete: {
    id: 'user-123',
    email: 'user@example.com',
    isEmailVerified: true,
    username: 'john-doe',
    name: 'John Doe',
    bio: 'Developer',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },

  // User after sync with Clerk (minimal fields)
  afterSync: {
    id: 'user-123',
    email: 'user@example.com',
    isEmailVerified: true,
    username: null,
    name: null,
    bio: null,
    avatarUrl: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },

  // User after name and bio update
  afterNameBioUpdate: {
    id: 'user-123',
    email: 'user@example.com',
    isEmailVerified: true,
    username: 'john-doe',
    name: 'John Updated',
    bio: 'Senior Developer',
    avatarUrl: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
  },

  // User after username update
  afterUsernameUpdate: {
    id: 'user-123',
    email: 'user@example.com',
    isEmailVerified: true,
    username: 'new-username',
    name: 'John Doe',
    bio: 'Developer',
    avatarUrl: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
  },
};

export const avatarResponseExample = {
  url: 'https://cdn.example.com/avatars/user-123/abc-def-ghi.jpg',
};

export const updateNameAndBioRequestExample = {
  example1: {
    value: {
      name: 'John Doe',
      bio: 'I am a software developer',
    },
  },
};

export const updateUsernameRequestExample = {
  example1: {
    value: {
      username: 'john-doe-123',
    },
  },
};
