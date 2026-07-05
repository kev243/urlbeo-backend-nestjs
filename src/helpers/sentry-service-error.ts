import * as Sentry from '@sentry/nestjs';

type Primitive = string | number | boolean | null;

export type SentryContext = Record<
  string,
  Primitive | Primitive[] | Record<string, Primitive>
>;

export interface CaptureServiceErrorOptions {
  service: string;
  operation: string;
  userId?: string;
  context?: SentryContext;
}

export function captureServiceError(
  error: unknown,
  options: CaptureServiceErrorOptions,
) {
  Sentry.withScope((scope) => {
    scope.setTag('service', options.service);
    scope.setTag('operation', options.operation);

    if (options.userId) {
      scope.setUser({ id: options.userId });
    }

    if (options.context) {
      scope.setContext('service_context', options.context);
    }

    Sentry.captureException(error);
  });
}
