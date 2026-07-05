import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;
const environment =
  process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';
const release =
  process.env.SENTRY_RELEASE ?? process.env.npm_package_version ?? '0.0.0';
const service = process.env.SENTRY_SERVICE ?? 'urlbeo-backend';

if (!dsn) {
  console.warn(
    '[Sentry] Warning: SENTRY_DSN is not set. Sentry will not be initialized.',
  );
}

Sentry.init({
  dsn,
  environment,
  release,
  tracesSampleRate: 0.1,
  dataCollection: {
    // userInfo: false,
    // httpBodies: [],
  },
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      service,
    };
    return event;
  },
});

// Tags globaux (scope process)
Sentry.setTag('service', service);
Sentry.setTag('environment', environment);
