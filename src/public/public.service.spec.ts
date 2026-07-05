import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';
import { captureServiceError } from '../helpers/sentry-service-error';
import { logServiceError } from '../helpers/log-service';

jest.mock('../helpers/sentry-service-error', () => ({
  captureServiceError: jest.fn(),
}));

jest.mock('../helpers/log-service', () => ({
  logServiceError: jest.fn(),
}));

describe('PublicService', () => {
  let service: PublicService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
    };
  };

  const baseUser = {
    id: 'user_1',
    username: 'kevin',
    name: 'Kevin',
    bio: 'Bio',
    avatarUrl: 'https://example.com/avatar.png',
    createdAt: new Date('2026-07-05T00:00:00.000Z'),
    links: [
      {
        id: 'link_1',
        title: 'My link',
        url: 'https://example.com',
        isActive: true,
        createdAt: new Date('2026-07-05T00:00:00.000Z'),
        updatedAt: new Date('2026-07-05T00:00:00.000Z'),
        position: 1,
      },
    ],
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException when username is empty', async () => {
    await expect(service.ensureUserExistsByUsername('')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should throw NotFoundException when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.ensureUserExistsByUsername('kevin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should return the public user payload when the user exists', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(baseUser)
      .mockResolvedValueOnce(baseUser);

    const result = await service.getUserByUsername({ username: 'kevin' });

    expect(result).toEqual(baseUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2);
    expect(captureServiceError).not.toHaveBeenCalled();
    expect(logServiceError).not.toHaveBeenCalled();
  });

  it('should keep the HttpException when username is invalid', async () => {
    await expect(
      service.getUserByUsername({ username: '' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(captureServiceError).toHaveBeenCalled();
    expect(logServiceError).toHaveBeenCalled();
  });
});
