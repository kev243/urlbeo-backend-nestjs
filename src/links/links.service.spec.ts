import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LinksService } from './links.service';

describe('LinksService', () => {
  let service: LinksService;
  let prismaMock: any;
  let usersServiceMock: any;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const sampleLink = {
    id: 'link-1',
    userId: 'user-1',
    title: 'Example link',
    url: 'https://example.com',
    isActive: true,
    position: 0,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prismaMock = {
      link: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    usersServiceMock = {
      ensureUserExists: jest.fn().mockImplementation((userId: string) => {
        if (!userId) {
          return Promise.reject(new BadRequestException('User ID is required'));
        }
        return Promise.resolve(undefined);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLink', () => {
    it('creates a new link with next position', async () => {
      prismaMock.link.findFirst.mockResolvedValue({
        ...sampleLink,
        position: 2,
      });
      prismaMock.link.create.mockResolvedValue({ ...sampleLink, position: 3 });

      const result = await service.createLink('user-1', {
        title: 'New link',
        url: 'https://example.com',
      });

      expect(usersServiceMock.ensureUserExists).toHaveBeenCalledWith('user-1');
      expect(prismaMock.link.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { position: 'desc' },
      });
      expect(prismaMock.link.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: 'New link',
          url: 'https://example.com',
          isActive: true,
          position: 3,
        },
      });
      expect(result.position).toBe(3);
    });

    it('throws if userId is missing', async () => {
      await expect(
        service.createLink('', { title: 'Test', url: 'https://example.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getLinksByUserId', () => {
    it('returns links ordered by position', async () => {
      prismaMock.link.findMany.mockResolvedValue([sampleLink]);

      const result = await service.getLinksByUserId('user-1');

      expect(usersServiceMock.ensureUserExists).toHaveBeenCalledWith('user-1');
      expect(prismaMock.link.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { position: 'asc' },
      });
      expect(result).toEqual([sampleLink]);
    });

    it('throws if userId is missing', async () => {
      await expect(service.getLinksByUserId('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('updateIsActiveStatus', () => {
    it('updates isActive when link exists and belongs to user', async () => {
      prismaMock.link.findUnique.mockResolvedValue(sampleLink);
      prismaMock.link.update.mockResolvedValue({
        ...sampleLink,
        isActive: false,
      });

      const result = await service.updateIsActiveStatus(
        'link-1',
        'user-1',
        false,
      );

      expect(usersServiceMock.ensureUserExists).toHaveBeenCalledWith('user-1');
      expect(prismaMock.link.findUnique).toHaveBeenCalledWith({
        where: { id: 'link-1' },
      });
      expect(prismaMock.link.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('throws if linkId is missing', async () => {
      await expect(
        service.updateIsActiveStatus('', 'user-1', true),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if userId is missing', async () => {
      await expect(
        service.updateIsActiveStatus('link-1', '', true),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if isActive is not boolean', async () => {
      await expect(
        service.updateIsActiveStatus('link-1', 'user-1', undefined as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if link is not found', async () => {
      prismaMock.link.findUnique.mockResolvedValue(null);

      await expect(
        service.updateIsActiveStatus('link-1', 'user-1', true),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws if link belongs to another user', async () => {
      prismaMock.link.findUnique.mockResolvedValue({
        ...sampleLink,
        userId: 'user-2',
      });

      await expect(
        service.updateIsActiveStatus('link-1', 'user-1', true),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateLink', () => {
    it('updates link title and url', async () => {
      const updatedLink = {
        ...sampleLink,
        title: 'Updated',
        url: 'https://updated.com',
      };
      prismaMock.link.findUnique.mockResolvedValue(sampleLink);
      prismaMock.link.update.mockResolvedValue(updatedLink);

      const result = await service.updateLink('link-1', 'user-1', {
        title: 'Updated',
        url: 'https://updated.com',
      });

      expect(usersServiceMock.ensureUserExists).toHaveBeenCalledWith('user-1');
      expect(prismaMock.link.findUnique).toHaveBeenCalledWith({
        where: { id: 'link-1' },
      });
      expect(prismaMock.link.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: { title: 'Updated', url: 'https://updated.com' },
      });
      expect(result.title).toBe('Updated');
      expect(result.url).toBe('https://updated.com');
    });

    it('throws if linkId is missing', async () => {
      await expect(
        service.updateLink('', 'user-1', {
          title: 'Test',
          url: 'https://example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if userId is missing', async () => {
      await expect(
        service.updateLink('link-1', '', {
          title: 'Test',
          url: 'https://example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws if link is not found', async () => {
      prismaMock.link.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLink('link-1', 'user-1', {
          title: 'Test',
          url: 'https://example.com',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws if link belongs to another user', async () => {
      prismaMock.link.findUnique.mockResolvedValue({
        ...sampleLink,
        userId: 'user-2',
      });

      await expect(
        service.updateLink('link-1', 'user-1', {
          title: 'Test',
          url: 'https://example.com',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('deleteLink', () => {
    it('deletes link when it belongs to user', async () => {
      prismaMock.link.findUnique.mockResolvedValue(sampleLink);
      prismaMock.link.delete.mockResolvedValue(undefined);

      await expect(
        service.deleteLink('link-1', 'user-1'),
      ).resolves.toBeUndefined();

      expect(usersServiceMock.ensureUserExists).toHaveBeenCalledWith('user-1');
      expect(prismaMock.link.findUnique).toHaveBeenCalledWith({
        where: { id: 'link-1' },
      });
      expect(prismaMock.link.delete).toHaveBeenCalledWith({
        where: { id: 'link-1' },
      });
    });

    it('throws if linkId is missing', async () => {
      await expect(service.deleteLink('', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws if userId is missing', async () => {
      await expect(service.deleteLink('link-1', '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws if link is not found', async () => {
      prismaMock.link.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteLink('link-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws if link belongs to another user', async () => {
      prismaMock.link.findUnique.mockResolvedValue({
        ...sampleLink,
        userId: 'user-2',
      });

      await expect(
        service.deleteLink('link-1', 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('updateLinkPosition', () => {
    it('reorders links and updates positions', async () => {
      const links = [
        { ...sampleLink, id: 'link-1', position: 0 },
        { ...sampleLink, id: 'link-2', position: 1 },
        { ...sampleLink, id: 'link-3', position: 2 },
      ];
      prismaMock.link.findMany.mockResolvedValue(links);
      prismaMock.$transaction.mockResolvedValue([
        { ...links[1], position: 0 },
        { ...links[0], position: 1 },
        { ...links[2], position: 2 },
      ]);

      const result = await service.updateLinkPosition('user-1', 'link-2', 0);

      expect(usersServiceMock.ensureUserExists).toHaveBeenCalledWith('user-1');
      expect(prismaMock.link.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { position: 'asc' },
      });
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result[0].position).toBe(0);
    });

    it('throws if link is not found', async () => {
      prismaMock.link.findMany.mockResolvedValue([]);

      await expect(
        service.updateLinkPosition('user-1', 'link-1', 0),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws if new position is invalid', async () => {
      prismaMock.link.findMany.mockResolvedValue([sampleLink]);

      await expect(
        service.updateLinkPosition('user-1', 'link-1', 2),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
