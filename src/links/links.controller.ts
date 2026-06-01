import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreateLinkDto } from '../dto/link.dto';
import { SanitizeHtmlPipe } from '../pipes/sanitize-html.pipe';

@Controller({ path: 'links', version: '1' })
@UseGuards(ClerkAuthGuard)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('create')
  async createLink(
    @CurrentUserId() userId: string,
    @Body(new SanitizeHtmlPipe()) createLinkDto: CreateLinkDto,
  ) {
    return this.linksService.createLink(userId, createLinkDto);
  }

  @Get()
  async getLinksByUserId(@CurrentUserId() userId: string) {
    return this.linksService.getLinksByUserId(userId);
  }

  @Patch(':linkId/update-status')
  async updateIsActiveStatus(
    @CurrentUserId() userId: string,
    @Body() updateIsActiveDto: { isActive: boolean },
    @Param('linkId') linkId: string,
  ) {
    const { isActive } = updateIsActiveDto;
    return this.linksService.updateIsActiveStatus(linkId, userId, isActive);
  }
}
