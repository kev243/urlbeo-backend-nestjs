import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { LinkDto, UpdateLinkPositionDto } from '../dto/link.dto';
import { SanitizeHtmlPipe } from '../pipes/sanitize-html.pipe';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBody,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  linkExamples,
  linksArrayExample,
  createLinkRequestExample,
  updateLinkRequestExample,
  updateLinkStatusRequestExample,
  updateLinkPositionRequestExample,
} from './swagger-examples';

@Controller({ path: 'links', version: '1' })
@UseGuards(ClerkAuthGuard)
@ApiTags('Links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create a new link',
    description:
      'Creates a new link for the authenticated user. HTML content in title and description is sanitized.',
  })
  @ApiResponse({
    status: 201,
    description: 'Link successfully created',
    schema: {
      example: linkExamples.created,
    },
  })
  @ApiBody({
    type: LinkDto,
    examples: createLinkRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid link data (title and url are required, url must be valid)',
  })
  async createLink(
    @CurrentUserId() userId: string,
    @Body(new SanitizeHtmlPipe()) createLinkDto: LinkDto,
  ) {
    return this.linksService.createLink(userId, createLinkDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user links',
    description:
      'Retrieves all links for the authenticated user, ordered by position',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user links',
    schema: linksArrayExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description: 'User ID is missing or invalid',
  })
  async getLinksByUserId(@CurrentUserId() userId: string) {
    return this.linksService.getLinksByUserId(userId);
  }

  @Patch(':linkId')
  @ApiOperation({
    summary: 'Update a link',
    description:
      'Updates the title, URL, or description of an existing link. User must own the link. HTML content is sanitized.',
  })
  @ApiResponse({
    status: 200,
    description: 'Link successfully updated',
    schema: {
      example: linkExamples.single,
    },
  })
  @ApiBody({
    type: LinkDto,
    examples: updateLinkRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description: 'Invalid link data or link ID is missing',
  })
  @ApiNotFoundResponse({
    description: 'Link not found or user does not own this link',
  })
  async updateLink(
    @CurrentUserId() userId: string,
    @Param('linkId') linkId: string,
    @Body(new SanitizeHtmlPipe()) updateLinkDto: LinkDto,
  ) {
    return this.linksService.updateLink(linkId, userId, updateLinkDto);
  }

  @Patch(':linkId/update-status')
  @ApiOperation({
    summary: 'Toggle link active status',
    description:
      'Changes the active/inactive status of a link. User must own the link.',
  })
  @ApiResponse({
    status: 200,
    description: 'Link status successfully updated',
    schema: {
      example: linkExamples.inactive,
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: 'Whether the link should be active or inactive',
        },
      },
      required: ['isActive'],
    },
    examples: updateLinkStatusRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description: 'Invalid status value or link ID is missing',
  })
  @ApiNotFoundResponse({
    description: 'Link not found or user does not own this link',
  })
  async updateIsActiveStatus(
    @CurrentUserId() userId: string,
    @Body() updateIsActiveDto: { isActive: boolean },
    @Param('linkId') linkId: string,
  ) {
    const { isActive } = updateIsActiveDto;
    return this.linksService.updateIsActiveStatus(linkId, userId, isActive);
  }

  @Delete(':linkId')
  @ApiOperation({
    summary: 'Delete a link',
    description: 'Deletes a link. User must own the link.',
  })
  @ApiResponse({
    status: 200,
    description: 'Link successfully deleted',
    schema: {
      example: {
        message: 'Link deleted successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description: 'Link ID is missing',
  })
  @ApiNotFoundResponse({
    description: 'Link not found or user does not own this link',
  })
  async deleteLink(
    @CurrentUserId() userId: string,
    @Param('linkId') linkId: string,
  ) {
    await this.linksService.deleteLink(linkId, userId);
    return { message: 'Link deleted successfully' };
  }

  @Patch(':id/position')
  @ApiOperation({
    summary: 'Update link position',
    description:
      'Reorders a link by updating its position. User must own the link.',
  })
  @ApiResponse({
    status: 200,
    description: 'Link position successfully updated',
    schema: {
      example: linkExamples.single,
    },
  })
  @ApiBody({
    type: UpdateLinkPositionDto,
    examples: updateLinkPositionRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description: 'Invalid position value or link ID is missing',
  })
  @ApiNotFoundResponse({
    description: 'Link not found or user does not own this link',
  })
  async updateLinkPosition(
    @CurrentUserId() userId: string,
    @Param('id') linkId: string,
    @Body() dto: UpdateLinkPositionDto,
  ) {
    return this.linksService.updateLinkPosition(userId, linkId, dto.position);
  }
}
