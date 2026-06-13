import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

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

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid avatar format. Allowed formats: jpeg, png, webp',
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new PayloadTooLargeException(
        'Avatar file is too large. Maximum size is 5MB',
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
}
