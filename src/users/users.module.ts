import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClerkClientProvider } from '../providers/clerk.provider';

@Module({
  providers: [UsersService, ClerkClientProvider],
  controllers: [UsersController],
})
export class UsersModule {}
