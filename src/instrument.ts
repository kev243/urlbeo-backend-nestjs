import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (!dsn) {
  console.warn(
    '[Sentry] Warning: SENTRY_DSN is not set. Sentry will not be initialized.',
  );
}

Sentry.init({
  dsn,
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
