/**
 * Swagger/OpenAPI examples for Links API responses
 */

export const linkExamples = {
  // Single link with all fields populated
  single: {
    id: 'link-123',
    userId: 'user-456',
    title: 'GitHub Repository',
    url: 'https://github.com/user/repo',
    description: 'My awesome project repository',
    isActive: true,
    position: 1,
    createdAt: '2025-01-10T08:30:00Z',
    updatedAt: '2025-01-15T14:20:00Z',
  },

  // Link after creation (minimal fields)
  created: {
    id: 'link-789',
    userId: 'user-456',
    title: 'Documentation',
    url: 'https://docs.example.com',
    description: null,
    isActive: true,
    position: 2,
    createdAt: '2025-01-15T15:00:00Z',
    updatedAt: '2025-01-15T15:00:00Z',
  },

  // Inactive link
  inactive: {
    id: 'link-123',
    userId: 'user-456',
    title: 'GitHub Repository',
    url: 'https://github.com/user/repo',
    description: 'My awesome project repository',
    isActive: false,
    position: 1,
    createdAt: '2025-01-10T08:30:00Z',
    updatedAt: '2025-01-15T14:25:00Z',
  },
};

export const linksArrayExample = {
  example: [linkExamples.single, linkExamples.created],
};

export const createLinkRequestExample = {
  example1: {
    value: {
      title: 'GitHub Repository',
      url: 'https://github.com/user/repo',
      description: 'My awesome project repository',
    },
  },
};

export const updateLinkRequestExample = {
  example1: {
    value: {
      title: 'Updated GitHub Repo',
      url: 'https://github.com/user/updated-repo',
      description: 'Updated description',
    },
  },
};

export const updateLinkStatusRequestExample = {
  example1: {
    value: {
      isActive: false,
    },
  },
};

export const updateLinkPositionRequestExample = {
  example1: {
    value: {
      position: 3,
    },
  },
};
