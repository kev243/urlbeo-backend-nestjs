import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { handleServiceError } from '../helpers/handle-service-error';
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
      return this.prisma.$transaction(async (tx) => {
        await tx.link.updateMany({
          where: { userId },
          data: {
            position: {
              increment: 1,
            },
          },
        });

        return tx.link.create({
          data: {
            userId,
            title: createLinkDto.title,
            url: createLinkDto.url,
            isActive: true,
            position: 0,
          },
        });
      });
    } catch (error) {
      handleServiceError(
        error,
        'LinksService.createLink',
        'Failed to create link',
        {
          service: 'links',
          operation: 'createLink',
          userId,
          context: {
            hasTitle:
              typeof createLinkDto?.title === 'string' &&
              createLinkDto.title.length > 0,
            hasUrl:
              typeof createLinkDto?.url === 'string' &&
              createLinkDto.url.length > 0,
          },
        },
      );
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
      handleServiceError(
        error,
        'LinksService.updateLink',
        'Failed to update link',
        {
          service: 'links',
          operation: 'updateLink',
          userId,
          context: {
            linkId,
            hasTitle:
              typeof updateLinkDto?.title === 'string' &&
              updateLinkDto.title.length > 0,
            hasUrl:
              typeof updateLinkDto?.url === 'string' &&
              updateLinkDto.url.length > 0,
          },
        },
      );
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
      handleServiceError(
        error,
        'LinksService.getLinksByUserId',
        'Failed to retrieve links',
        {
          service: 'links',
          operation: 'getLinksByUserId',
          userId,
        },
      );
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
      handleServiceError(
        error,
        'LinksService.updateIsActiveStatus',
        'Failed to update link status',
        {
          service: 'links',
          operation: 'updateIsActiveStatus',
          userId,
          context: {
            linkId,
            isActive,
          },
        },
      );
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
      handleServiceError(
        error,
        'LinksService.deleteLink',
        'Failed to delete link',
        {
          service: 'links',
          operation: 'deleteLink',
          userId,
          context: {
            linkId,
          },
        },
      );
    }
  }

  async updateLinkPosition(
    userId: string,
    linkId: string,
    newPosition: number,
  ): Promise<Links[]> {
    try {
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
    } catch (error) {
      handleServiceError(
        error,
        'LinksService.updateLinkPosition',
        'Failed to update link position',
        {
          service: 'links',
          operation: 'updateLinkPosition',
          userId,
          context: {
            linkId,
            newPosition,
          },
        },
      );
    }
  }
}
