import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

export const ClerkClientProvider = {
  provide: 'ClerkClient',
  useFactory: (configService: ConfigService) => {
    const publishableKey = configService.get('CLERK_PUBLISHABLE_KEY');
    const secretKey = configService.get('CLERK_SECRET_KEY');

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
