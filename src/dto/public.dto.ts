import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransformFnParams } from 'class-transformer/types/interfaces';

function normalizeUsername({ value }: TransformFnParams): unknown {
  const input: unknown = value;
  return typeof input === 'string' ? input.toLowerCase().trim() : input;
}

export class PublicParamUsernameDto {
  @ApiProperty({
    example: 'kevin-nimi',
    description: 'Unique username for the user',
    maxLength: 30,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Username can only contain letters, numbers, and hyphens',
  })
  @Transform(normalizeUsername)
  username!: string;
}
