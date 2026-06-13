import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { logServiceError } from '../helpers/log-service';
import { handlePrismaError } from '../helpers/handle-prisma-error';
import { Links } from '../types/links.type';
import { UsersService } from '../users/users.service';
import { LinkDto } from '../dto/link.dto';

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createLink(userId: string, createLinkDto: LinkDto): Promise<Links> {
    try {
      await this.usersService.ensureUserExists(userId);

      const lastLink = await this.prisma.link.findFirst({
        where: {
          userId,
        },
        orderBy: {
          position: 'desc',
        },
      });

      const nextPosition = lastLink ? lastLink.position + 1 : 0;

      const link = await this.prisma.link.create({
        data: {
          userId,
          title: createLinkDto.title,
          url: createLinkDto.url,
          isActive: true,
          position: nextPosition,
        },
      });

      return link;
    } catch (error) {
      logServiceError('LinksService.createLink', error);
      throw handlePrismaError(error, 'Failed to create link');
    }
  }

  async updateLink(
    linkId: string,
    userId: string,
    updateLinkDto: LinkDto,
  ): Promise<Links> {
    try {
      await this.usersService.ensureUserExists(userId);

      if (!linkId) {
        throw new BadRequestException('Link ID is required to update a link');
      }

      const link = await this.prisma.link.findUnique({
        where: { id: linkId },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (link.userId !== userId) {
        throw new ForbiddenException('Unauthorized to update this link');
      }

      return await this.prisma.link.update({
        where: { id: linkId },
        data: {
          title: updateLinkDto.title,
          url: updateLinkDto.url,
        },
      });
    } catch (error) {
      logServiceError('LinksService.updateLink', error);
      throw handlePrismaError(error, 'Failed to update link');
    }
  }

  async getLinksByUserId(userId: string): Promise<Links[]> {
    try {
      await this.usersService.ensureUserExists(userId);
      return await this.prisma.link.findMany({
        where: {
          userId,
        },
        orderBy: {
          position: 'asc',
        },
      });
    } catch (error) {
      logServiceError('LinksService.getLinksByUserId', error);
      throw handlePrismaError(error, 'Failed to retrieve links');
    }
  }
  async updateIsActiveStatus(
    linkId: string,
    userId: string,
    isActive: boolean,
  ): Promise<Links> {
    try {
      await this.usersService.ensureUserExists(userId);
      if (!linkId) {
        throw new BadRequestException(
          'Link ID is required to update link status',
        );
      }

      if (typeof isActive !== 'boolean') {
        throw new BadRequestException('isActive must be a boolean value');
      }
      const link = await this.prisma.link.findUnique({
        where: { id: linkId },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (link.userId !== userId) {
        throw new ForbiddenException('Unauthorized to update this link');
      }

      return await this.prisma.link.update({
        where: { id: linkId },
        data: { isActive },
      });
    } catch (error) {
      logServiceError('LinksService.updateIsActiveStatus', error);
      throw handlePrismaError(error, 'Failed to update link status');
    }
  }

  async deleteLink(linkId: string, userId: string): Promise<void> {
    try {
      await this.usersService.ensureUserExists(userId);

      if (!linkId) {
        throw new BadRequestException('Link ID is required to delete a link');
      }

      const link = await this.prisma.link.findUnique({
        where: { id: linkId },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (link.userId !== userId) {
        throw new ForbiddenException('Unauthorized to delete this link');
      }

      await this.prisma.link.delete({
        where: { id: linkId },
      });
    } catch (error) {
      logServiceError('LinksService.deleteLink', error);
      throw handlePrismaError(error, 'Failed to delete link');
    }
  }

  async updateLinkPosition(
    userId: string,
    linkId: string,
    newPosition: number,
  ): Promise<Links[]> {
    await this.usersService.ensureUserExists(userId);

    const links = await this.prisma.link.findMany({
      where: {
        userId,
      },
      orderBy: {
        position: 'asc',
      },
    });

    const currentIndex = links.findIndex((link) => link.id === linkId);

    if (currentIndex === -1) {
      throw new NotFoundException('Link not found');
    }

    if (newPosition < 0 || newPosition >= links.length) {
      throw new BadRequestException('Invalid position');
    }

    const [movedLink] = links.splice(currentIndex, 1);
    links.splice(newPosition, 0, movedLink);

    const updatedLinks = await this.prisma.$transaction(
      links.map((link, index) =>
        this.prisma.link.update({
          where: {
            id: link.id,
          },
          data: {
            position: index,
          },
        }),
      ),
    );

    return updatedLinks;
  }
}
