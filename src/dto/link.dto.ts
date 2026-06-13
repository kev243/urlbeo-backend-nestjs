import {
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LinkDto {
  @ApiProperty({
    example: 'My Portfolio',
    description: 'Title of the link',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @ApiProperty({
    example: 'https://www.myportfolio.com',
    description: 'URL of the link',
    maxLength: 2048,
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
  })
  @MaxLength(2048)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  url!: string;
}

export class UpdateLinkPositionDto {
  @ApiProperty({
    example: 1,
    description: 'New position of the link',
  })
  @IsInt()
  @Min(0)
  position!: number;
}
