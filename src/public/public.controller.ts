import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { PublicParamUsernameDto } from '../dto/public.dto';
import {
  publicUserByUsernameExample,
  notFoundUserByUsernameExample,
} from './swagger-exemples';

@Controller({ path: 'public', version: '1' })
@ApiTags('Public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('user/:username')
  @ApiOperation({
    summary: 'Get user by username',
    description:
      'Retrieves the public profile of a user by their username. This endpoint is publicly accessible and does not require authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: publicUserByUsernameExample,
  })
  @ApiNotFoundResponse({
    description: 'User not found by username',
    schema: notFoundUserByUsernameExample,
  })
  async getUserByUsername(@Param() dto: PublicParamUsernameDto) {
    return this.publicService.getUserByUsername(dto);
  }
}
