import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

type PrismaErrorLike = {
  code?: string;
};

function isPrismaErrorLike(error: unknown): error is PrismaErrorLike {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function handlePrismaError(error: unknown, message: string): never {
  if (isPrismaErrorLike(error) && error.code === 'P2002') {
    throw new BadRequestException('Unique constraint failed');
  }
  if (isPrismaErrorLike(error) && error.code === 'P2025') {
    throw new NotFoundException('Resource not found');
  }
  if (error instanceof HttpException) throw error;

  throw new InternalServerErrorException(message);
}
