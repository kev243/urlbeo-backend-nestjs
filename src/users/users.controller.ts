import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { UsersService } from './users.service';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { UpdateBioDto, UpdateUsernameDto } from '../dto/user.dto';
import { SanitizeHtmlPipe } from '../pipes/sanitize-html.pipe';

@Controller({ path: 'users', version: '1' })
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('sync')
  async syncAuthenticatedUser(@CurrentUserId() userId: string) {
    return this.usersService.syncAuthenticatedUser(userId);
  }

  @Patch('bio')
  updateBio(
    @CurrentUserId() userId: string,
    @Body(new SanitizeHtmlPipe()) dto: UpdateBioDto,
  ) {
    return this.usersService.updateBio(userId, dto);
  }

  @Patch('username')
  updateUsername(
    @CurrentUserId() userId: string,
    @Body(new SanitizeHtmlPipe()) dto: UpdateUsernameDto,
  ) {
    return this.usersService.updateUsername(userId, dto);
  }
}
