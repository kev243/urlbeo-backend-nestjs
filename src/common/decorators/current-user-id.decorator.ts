import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.auth?.clerkUserId;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return userId;
  },
);
