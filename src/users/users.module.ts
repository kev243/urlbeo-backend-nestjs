import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ClerkClientProvider } from '../providers/clerk.provider';
@Global()
@Module({
  providers: [UsersService, ClerkClientProvider],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
