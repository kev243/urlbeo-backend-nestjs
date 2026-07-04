import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { UsersService } from './users.service';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateNameAndBioDto, UpdateUsernameDto } from '../dto/user.dto';
import { SanitizeHtmlPipe } from '../common/pipes/sanitize-html.pipe';
import {
  ApiBody,
  ApiConflictResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  userExamples,
  avatarResponseExample,
  updateNameAndBioRequestExample,
  updateUsernameRequestExample,
} from './swagger-examples';
import { Throttle } from '@nestjs/throttler';

@Controller({ path: 'users', version: '1' })
@UseGuards(ClerkAuthGuard)
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieves the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the current user profile',
    schema: {
      example: userExamples.complete,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiNotFoundResponse({
    description: 'User not found in database',
  })
  async getCurrentUser(@CurrentUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Get('sync')
  @ApiOperation({
    summary: 'Sync authenticated user',
    description:
      'Synchronizes the user profile with Clerk authentication provider and updates the database',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully synchronized with Clerk',
    schema: {
      example: userExamples.afterSync,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description: 'User primary email is required or user ID is missing',
  })
  async syncAuthenticatedUser(@CurrentUserId() userId: string) {
    return this.usersService.syncAuthenticatedUser(userId);
  }

  @Patch('name-and-bio')
  @ApiOperation({
    summary: 'Update user name and bio',
    description:
      'Updates the name and bio fields of the currently authenticated user. HTML content is sanitized.',
  })
  @ApiResponse({
    status: 200,
    description: 'User name and bio successfully updated',
    schema: {
      example: userExamples.afterNameBioUpdate,
    },
  })
  @ApiBody({
    type: UpdateNameAndBioDto,
    examples: updateNameAndBioRequestExample,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid name or bio format (name: 1-50 chars, bio: 1-200 chars)',
  })
  @ApiNotFoundResponse({
    description: 'User not found in database',
  })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async updateNameAndBio(
    @CurrentUserId() userId: string,
    @Body(new SanitizeHtmlPipe()) dto: UpdateNameAndBioDto,
  ) {
    return this.usersService.updateNameAndBio(userId, dto);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('username')
  @ApiOperation({
    summary: 'Update user username',
    description:
      'Updates the username of the currently authenticated user. Username must be unique, 3-30 characters, and contain only letters, numbers, and hyphens. Input is normalized to lowercase and trimmed.',
  })
  @ApiResponse({
    status: 200,
    description: 'User username successfully updated',
    schema: {
      example: userExamples.afterUsernameUpdate,
    },
  })
  @ApiBody({
    type: UpdateUsernameDto,
    examples: updateUsernameRequestExample,
  })
  @ApiConflictResponse({
    description: 'Username is already taken by another user',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid username format (must be 3-30 characters, contain only letters, numbers, and hyphens)',
  })
  @ApiNotFoundResponse({
    description: 'User not found in database',
  })
  async updateUsername(
    @CurrentUserId() userId: string,
    @Body(new SanitizeHtmlPipe()) dto: UpdateUsernameDto,
  ) {
    return this.usersService.updateUsername(userId, dto);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Patch('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Update user avatar',
    description:
      'Uploads and updates the avatar for the currently authenticated user. Supported formats: JPEG, PNG, WebP. Maximum file size: 5MB. File is stored on Cloudflare R2.',
  })
  @ApiResponse({
    status: 200,
    description: 'User avatar successfully updated',
    schema: {
      example: avatarResponseExample,
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, or WebP, max 5MB)',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Clerk bearer token',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid file format (allowed: JPEG, PNG, WebP) or file is required',
  })
  @ApiNotFoundResponse({
    description: 'User not found in database',
  })
  async updateUserAvatarUrl(
    @CurrentUserId() userId: string,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.usersService.updateUserAvatarUrl(userId, avatar);
  }
}
