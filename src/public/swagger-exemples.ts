/**
 * Swagger/OpenAPI examples for user public API responses
 */

export const publicUserByUsernameExample = {
  example: {
    id: 'user-123',
    username: 'johndoe',
    name: 'John Doe',
    bio: 'Software developer and tech enthusiast.',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '2025-01-10T08:30:00Z',
    links: [
      {
        id: 'link-456',
        title: 'GitHub Repository',
        url: 'https://github.com/johndoe/repository',
        isActive: true,
        createdAt: '2025-01-10T08:30:00Z',
        updatedAt: '2025-01-10T08:30:00Z',
        position: 1,
      },
    ],
  },
};

export const notFoundUserByUsernameExample = {
  example: {
    message: 'User not found',
    error: 'Not Found',
    statusCode: 404,
  },
};
