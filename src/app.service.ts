import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiPresentation() {
    return {
      name: 'Urlbeo API',
      description:
        'Urlbeo is a minimalist Linktree-style platform that allows users to group and share all their links on a single public page.',
      creator: {
        name: 'Kevin Nimi',
        role: 'Founder and developer',
      },
      features: [
        'User accounts',
        'Unique usernames',
        'Public profile pages',
        'Profile bio and avatar',
        'Link creation and management',
        'Drag and drop link ordering',
      ],
      health: {
        url: '/health',
        description: 'Use this endpoint to check the API status.',
      },
    };
  }
  getHealth() {
    return {
      status: 'ok',
      service: 'urlbeo-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
