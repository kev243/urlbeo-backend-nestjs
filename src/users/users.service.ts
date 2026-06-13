import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logServiceError } from '../helpers/log-service';
import { handlePrismaError } from '../helpers/handle-prisma-error';
import { Users } from '../types/users.type';
import { UpdateNameAndBioDto, UpdateUsernameDto } from '../dto/user.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('ClerkClient') private readonly clerkClient: any,
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
      await this.ensureUserExists(userId);

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
      logServiceError('UsersService.syncAuthenticatedUser', error);
      throw handlePrismaError(error, 'Failed to sync authenticated user');
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
      logServiceError('UsersService.getUserById', error);
      throw handlePrismaError(error, 'Failed to get user by ID');
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
      logServiceError('UsersService.updateNameAndBio', error);
      throw handlePrismaError(error, 'Failed to update user name and bio');
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
      logServiceError('UsersService.updateUsername', error);
      throw handlePrismaError(error, 'Failed to update user username');
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
      logServiceError('UsersService.updateUserAvatarUrl', error);
      throw handlePrismaError(error, 'Failed to update user avatar URL');
    }
  }
}
