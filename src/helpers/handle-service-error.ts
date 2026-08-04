import { HttpException } from '@nestjs/common';
import { handlePrismaError } from './handle-prisma-error';
import { logServiceError } from './log-service';
import {
  captureServiceError,
  CaptureServiceErrorOptions,
} from './sentry-service-error';

export function handleServiceError(
  error: unknown,
  logContext: string,
  fallbackMessage: string,
  sentryOptions: CaptureServiceErrorOptions,
): never {
  logServiceError(logContext, error);

  if (!(error instanceof HttpException)) {
    captureServiceError(error, sentryOptions);
  }

  handlePrismaError(error, fallbackMessage);
}
