import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;
  let clerkClientMock: any;
  let storageServiceMock: any;

  const sampleUser = {
    id: 'user-1',
    email: 'user@example.com',
    isEmailVerified: true,
    username: 'user1',
    name: 'User One',
    bio: 'Test bio',
    avatarUrl: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        upsert: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn((args: any) => {
          if (args.where?.id) {
            return Promise.resolve(sampleUser);
          }
          return Promise.resolve(null);
        }),
      },
    };

    clerkClientMock = {
      users: {
        getUser: jest.fn(),
      },
    };

    storageServiceMock = {
      uploadAvatar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: 'ClerkClient',
          useValue: clerkClientMock,
        },
        {
          provide: StorageService,
          useValue: storageServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureUserExists', () => {
    it('throws BadRequestException when userId is missing', async () => {
      await expect(service.ensureUserExists('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.ensureUserExists('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('resolves when user exists', async () => {
      await expect(service.ensureUserExists('user-1')).resolves.toBeUndefined();
    });
  });

  describe('syncAuthenticatedUser', () => {
    it('throws BadRequestException when userId is missing', async () => {
      await expect(service.syncAuthenticatedUser('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when primary email is missing', async () => {
      clerkClientMock.users.getUser.mockResolvedValue({
        id: 'user-1',
        emailAddresses: [],
        primaryEmailAddressId: 'email-1',
      });

      await expect(
        service.syncAuthenticatedUser('user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('upserts the clerk user and returns the user', async () => {
      clerkClientMock.users.getUser.mockResolvedValue({
        id: 'user-1',
        emailAddresses: [
          {
            id: 'email-1',
            emailAddress: 'user@example.com',
            verification: { status: 'verified' },
          },
        ],
        primaryEmailAddressId: 'email-1',
      });
      prismaMock.user.upsert.mockResolvedValue(sampleUser);

      const result = await service.syncAuthenticatedUser('user-1');

      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        update: {
          email: 'user@example.com',
          isEmailVerified: true,
        },
        create: {
          id: 'user-1',
          email: 'user@example.com',
          isEmailVerified: true,
        },
      });
      expect(result).toEqual(sampleUser);
    });
  });

  describe('updateNameAndBio', () => {
    it('throws BadRequestException when userId is missing', async () => {
      await expect(
        service.updateNameAndBio('', { name: 'Name', bio: 'Bio' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates the user name and bio', async () => {
      const updatedUser = { ...sampleUser, name: 'New Name', bio: 'New Bio' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateNameAndBio('user-1', {
        name: 'New Name',
        bio: 'New Bio',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name', bio: 'New Bio' },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateUsername', () => {
    it('throws BadRequestException when userId is missing', async () => {
      await expect(
        service.updateUsername('', { username: 'new-name' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException when username is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...sampleUser,
        id: 'user-2',
      });

      await expect(
        service.updateUsername('user-1', { username: 'user1' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('normalizes and updates username', async () => {
      prismaMock.user.findUnique.mockImplementation((args: any) => {
        if (args.where?.username === 'newusername') {
          return Promise.resolve(null);
        }
        return Promise.resolve(sampleUser);
      });
      const updatedUser = { ...sampleUser, username: 'newusername' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUsername('user-1', {
        username: ' NewUsername ',
      } as any);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'newusername' },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { username: 'newusername' },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateUserAvatarUrl', () => {
    it('throws BadRequestException when userId is missing', async () => {
      await expect(
        service.updateUserAvatarUrl('', {
          buffer: Buffer.from(''),
          mimetype: 'image/png',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when avatar is missing', async () => {
      await expect(
        service.updateUserAvatarUrl('user-1', null as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserAvatarUrl('user-1', {
          buffer: Buffer.from(''),
          mimetype: 'image/png',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('uploads avatar and updates user avatarUrl', async () => {
      prismaMock.user.findUnique.mockResolvedValue(sampleUser);
      storageServiceMock.uploadAvatar.mockResolvedValue(
        'https://cdn.example.com/avatar.png',
      );
      prismaMock.user.update.mockResolvedValue({
        ...sampleUser,
        avatarUrl: 'https://cdn.example.com/avatar.png',
      });

      const result = await service.updateUserAvatarUrl('user-1', {
        buffer: Buffer.from(''),
        mimetype: 'image/png',
      } as any);

      expect(storageServiceMock.uploadAvatar).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object),
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'https://cdn.example.com/avatar.png' },
      });
      expect(result).toEqual({ url: 'https://cdn.example.com/avatar.png' });
    });
  });
});
