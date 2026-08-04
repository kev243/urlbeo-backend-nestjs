import { BadRequestException } from '@nestjs/common';
import { handleServiceError } from './handle-service-error';
import { captureServiceError } from './sentry-service-error';

jest.mock('./sentry-service-error', () => ({
  captureServiceError: jest.fn(),
}));

describe('handleServiceError', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('does not send expected HTTP exceptions to Sentry', () => {
    const error = new BadRequestException('Invalid input');

    expect(() =>
      handleServiceError(error, 'TestService.operation', 'Fallback message', {
        service: 'test',
        operation: 'operation',
        userId: 'user-1',
      }),
    ).toThrow(BadRequestException);

    expect(captureServiceError).not.toHaveBeenCalled();
  });

  it('sends unexpected errors to Sentry before returning a safe HTTP error', () => {
    const error = new Error('Database connection failed');
    const sentryOptions = {
      service: 'test',
      operation: 'operation',
      userId: 'user-1',
    };

    expect(() =>
      handleServiceError(
        error,
        'TestService.operation',
        'Fallback message',
        sentryOptions,
      ),
    ).toThrow('Fallback message');

    expect(captureServiceError).toHaveBeenCalledWith(error, sentryOptions);
  });
});
