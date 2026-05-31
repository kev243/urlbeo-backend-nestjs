import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logServiceError } from '../helpers/log-service';
import { handlePrismaError } from '../helpers/handle-prisma-error';
import { Users } from '../types/users.type';
import { UpdateNameAndBioDto, UpdateUsernameDto } from '../dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('ClerkClient') private readonly clerkClient: any,
  ) {}

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
      logServiceError('UsersService.syncAuthenticatedUser', error);
      throw handlePrismaError(error, 'Failed to sync authenticated user');
    }
  }

  async updateNameAndBio(
    userId: string,
    dto: UpdateNameAndBioDto,
  ): Promise<Users> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

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
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
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

  //TODO: add updateAvatarUrl
}
