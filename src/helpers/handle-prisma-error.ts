import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export function handlePrismaError(error: any, message: string) {
  if (error.code === 'P2002') {
    throw new BadRequestException('Unique constraint failed');
  }
  if (error.code === 'P2025') {
    throw new NotFoundException('Resource not found');
  }
  if (error instanceof HttpException) throw error;

  throw new InternalServerErrorException(message);
}
