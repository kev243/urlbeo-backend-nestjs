import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ClerkClient } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';
import { logServiceError } from '../helpers/log-service';
import { captureServiceError } from '../helpers/sentry-service-error';
import { Users } from '../types/users.type';
import { UpdateNameAndBioDto, UpdateUsernameDto } from '../dto/user.dto';
import { StorageService } from '../storage/storage.service';
import { handleServiceError } from '../helpers/handle-service-error';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('ClerkClient') private readonly clerkClient: ClerkClient,
    private readonly storageService: StorageService,
  ) {}

  async ensureUserExists(userId: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  async syncAuthenticatedUser(userId: string): Promise<Users> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const clerkUser = await this.clerkClient.users.getUser(userId);

      const primaryEmail = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId,
      );

      if (!primaryEmail?.emailAddress) {
        throw new BadRequestException('User primary email is required');
      }

      const isEmailVerified = primaryEmail.verification?.status === 'verified';
      const email = primaryEmail.emailAddress;

      const user = await this.prisma.user.upsert({
        where: { id: clerkUser.id },
        update: {
          email,
          isEmailVerified,
        },
        create: {
          id: clerkUser.id,
          email,
          isEmailVerified,
        },
      });

      return user;
    } catch (error) {
      handleServiceError(
        error,
        'UsersService.syncAuthenticatedUser',
        'Failed to sync authenticated user',
        {
          service: 'users',
          operation: 'syncAuthenticatedUser',
          userId,
        },
      );
    }
  }

  async getUserById(userId: string): Promise<Users> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      handleServiceError(
        error,
        'UsersService.getUserById',
        'Failed to get user by ID',
        {
          service: 'users',
          operation: 'getUserById',
          userId,
        },
      );
    }
  }

  async updateNameAndBio(
    userId: string,
    dto: UpdateNameAndBioDto,
  ): Promise<Users> {
    try {
      await this.ensureUserExists(userId);

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name, bio: dto.bio },
      });

      return updatedUser;
    } catch (error) {
      handleServiceError(
        error,
        'UsersService.updateNameAndBio',
        'Failed to update user name and bio',
        {
          service: 'users',
          operation: 'updateNameAndBio',
          userId,
          context: {
            hasName: typeof dto?.name === 'string' && dto.name.length > 0,
            hasBio: typeof dto?.bio === 'string' && dto.bio.length > 0,
          },
        },
      );
    }
  }

  async updateUsername(userId: string, dto: UpdateUsernameDto): Promise<Users> {
    try {
      await this.ensureUserExists(userId);
      const normalizedUsername = dto.username.toLowerCase().trim();

      const existingUser = await this.prisma.user.findUnique({
        where: {
          username: normalizedUsername,
        },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { username: normalizedUsername },
      });

      return updatedUser;
    } catch (error) {
      handleServiceError(
        error,
        'UsersService.updateUsername',
        'Failed to update user username',
        {
          service: 'users',
          operation: 'updateUsername',
          userId,
          context: {
            hasUsername:
              typeof dto?.username === 'string' && dto.username.length > 0,
          },
        },
      );
    }
  }

  async updateUserAvatarUrl(
    userId: string,
    avatar: Express.Multer.File,
  ): Promise<{ url: string }> {
    try {
      await this.ensureUserExists(userId);

      if (!avatar) {
        throw new BadRequestException('Avatar file is required');
      }

      const avatarUrl = await this.storageService.uploadAvatar(userId, avatar);

      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: avatarUrl },
      });
      return { url: avatarUrl };
    } catch (error) {
      handleServiceError(
        error,
        'UsersService.updateUserAvatarUrl',
        'Failed to update user avatar URL',
        {
          service: 'users',
          operation: 'updateUserAvatarUrl',
          userId,
          context: {
            hasAvatar: !!avatar,
            avatarMimeType: avatar?.mimetype ?? null,
          },
        },
      );
    }
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      const user = await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!existingUser) {
          throw new NotFoundException('User not found');
        }

        await tx.user.delete({
          where: { id: userId },
        });

        return existingUser;
      });

      const cleanupErrors: Array<{
        source: 'storage' | 'clerk';
        error: unknown;
      }> = [];

      if (user.avatarUrl) {
        try {
          await this.storageService.deleteAvatar(user.avatarUrl);
        } catch (error) {
          cleanupErrors.push({ source: 'storage', error });
        }
      }

      try {
        await this.clerkClient.users.deleteUser(userId);
      } catch (error) {
        cleanupErrors.push({ source: 'clerk', error });
      }

      if (cleanupErrors.length > 0) {
        captureServiceError(cleanupErrors[0].error, {
          service: 'users',
          operation: 'deleteUser.cleanup',
          userId,
          context: {
            failedSources: cleanupErrors.map(({ source }) => source),
          },
        });

        logServiceError('UsersService.deleteUser.cleanup', cleanupErrors);
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      handleServiceError(
        error,
        'UsersService.deleteUser',
        'Failed to delete user',
        {
          service: 'users',
          operation: 'deleteUser',
          userId,
        },
      );
    }
  }
}
