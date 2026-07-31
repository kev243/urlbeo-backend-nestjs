import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  auth?: {
    clerkUserId?: string;
  };
};

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.clerkUserId;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return userId;
  },
);
