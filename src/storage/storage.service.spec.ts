import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeAll(() => {
    process.env.CLOUDFLARE_PUBLIC_URL = 'https://cdn.urlbeo.com';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects empty avatar files', async () => {
    await expect(
      service.uploadAvatar('user-1', {
        buffer: Buffer.alloc(0),
        mimetype: 'image/png',
        size: 0,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects avatar content that does not match the mimetype', async () => {
    await expect(
      service.uploadAvatar('user-1', {
        buffer: Buffer.from('not a png'),
        mimetype: 'image/png',
        size: 9,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects avatars larger than 5MB', async () => {
    await expect(
      service.uploadAvatar('user-1', {
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('rejects avatar deletion when the URL origin does not match storage', async () => {
    await expect(
      service.deleteAvatar('https://evil.example.com/avatars/user-1/a.png'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects avatar deletion outside the avatars folder', async () => {
    await expect(
      service.deleteAvatar('https://cdn.urlbeo.com/private/user-1/a.png'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
