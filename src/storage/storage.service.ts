import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isJpeg(buffer: Buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function isPng(buffer: Buffer) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return (
    buffer.length >= signature.length &&
    buffer.subarray(0, signature.length).equals(signature)
  );
}

function isWebp(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

@Injectable()
export class StorageService {
  private readonly s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
  });

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Avatar file is empty');
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid avatar format. Allowed formats: jpeg, png, webp',
      );
    }

    const fileSize = file.size || file.buffer.length;
    if (fileSize > MAX_AVATAR_SIZE) {
      throw new PayloadTooLargeException(
        'Avatar file is too large. Maximum size is 5MB',
      );
    }

    const hasValidSignature =
      (file.mimetype === 'image/jpeg' && isJpeg(file.buffer)) ||
      (file.mimetype === 'image/png' && isPng(file.buffer)) ||
      (file.mimetype === 'image/webp' && isWebp(file.buffer));

    if (!hasValidSignature) {
      throw new BadRequestException(
        'Avatar content does not match the declared file type',
      );
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    this.validateFile(file);
    const extension = MIME_TYPE_TO_EXTENSION[file.mimetype];
    const key = `avatars/${userId}/${randomUUID()}.${extension}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${process.env.CLOUDFLARE_PUBLIC_URL}/${key}`;
  }

  async deleteAvatar(avatarUrl: string) {
    if (!avatarUrl) {
      throw new BadRequestException('Avatar URL is required for deletion');
    }

    const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
    if (!publicUrl) {
      throw new Error('CLOUDFLARE_PUBLIC_URL is not set');
    }

    let avatarUrlObject: URL;
    let publicUrlObject: URL;

    try {
      avatarUrlObject = new URL(avatarUrl);
      publicUrlObject = new URL(publicUrl);
    } catch {
      throw new BadRequestException('Invalid avatar URL');
    }

    if (avatarUrlObject.origin !== publicUrlObject.origin) {
      throw new BadRequestException('Avatar URL does not match storage origin');
    }

    const basePath = publicUrlObject.pathname.replace(/\/$/, '');
    if (basePath && !avatarUrlObject.pathname.startsWith(`${basePath}/`)) {
      throw new BadRequestException('Avatar URL does not match storage path');
    }

    const key = decodeURIComponent(
      avatarUrlObject.pathname.slice(basePath.length).replace(/^\//, ''),
    );
    if (!key.startsWith('avatars/')) {
      throw new BadRequestException('Avatar key is outside the avatars folder');
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
        Key: key,
      }),
    );
  }
}
