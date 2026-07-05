import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicParamUsernameDto } from '../dto/public.dto';
import { ResponsePublicUserByUsername } from '../types/public';
import { logServiceError } from '../helpers/log-service';

import { handlePrismaError } from '../helpers/handle-prisma-error';
import { captureServiceError } from '../helpers/sentry-service-error';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUserExistsByUsername(username: string): Promise<void> {
    if (!username) {
      throw new BadRequestException('Username is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async getUserByUsername(
    dto: PublicParamUsernameDto,
  ): Promise<ResponsePublicUserByUsername> {
    try {
      await this.ensureUserExistsByUsername(dto.username);

      const user = await this.prisma.user.findUnique({
        where: {
          username: dto.username,
        },
        select: {
          id: true,
          username: true,
          name: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          links: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              url: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              position: true,
            },
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      if (!user || !user.username) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        links: user.links,
      };
    } catch (error) {
      captureServiceError(error, {
        service: 'PublicService.getUserByUsername',
        operation: 'getUserByUsername',
        context: {
          username: dto.username,
        },
      });
      logServiceError('PublicService.getUserByUsername', error);
      throw handlePrismaError(error, 'Failed to get user by username');
    }
  }
}
