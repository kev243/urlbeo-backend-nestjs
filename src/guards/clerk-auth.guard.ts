import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { IncomingHttpHeaders } from 'http';
import { Request } from 'express';

interface ClerkAuthRequest extends Request {
  headers: IncomingHttpHeaders;
  auth?: {
    clerkUserId: string;
    sessionId: string;
    claims: any;
  };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ClerkAuthRequest>();

    if (
      process.env.NODE_ENV === 'development' &&
      process.env.DEV_USER_ID &&
      process.env.ALLOW_DEV_AUTH_BYPASS === 'true'
    ) {
      req.auth = {
        clerkUserId: process.env.DEV_USER_ID,
        sessionId: 'dev-session',
        claims: { sub: process.env.DEV_USER_ID },
      };
      console.log(
        '[ClerkAuthGuard] Development mode - auto-authenticated as user:',
        process.env.DEV_USER_ID,
      );
      return true;
    }

    const authHeader = req.headers.authorization as string | undefined;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!token)
      throw new UnauthorizedException('Missing Authorization Bearer token');

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      req.auth = {
        clerkUserId: payload.sub,
        sessionId: payload.sid,
        claims: payload,
      };

      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }
}
