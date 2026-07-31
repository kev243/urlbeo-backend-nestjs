import { createClerkClient } from '@clerk/backend';
import type { ClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

export const ClerkClientProvider = {
  provide: 'ClerkClient',
  useFactory: (configService: ConfigService): ClerkClient => {
    const publishableKey = configService.get<string>('CLERK_PUBLISHABLE_KEY');
    const secretKey = configService.get<string>('CLERK_SECRET_KEY');

    if (!publishableKey || !secretKey) {
      throw new Error(
        'Clerk configuration error: CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must be set in environment variables.',
      );
    }
    return createClerkClient({
      publishableKey,
      secretKey,
    });
  },
  inject: [ConfigService],
};
