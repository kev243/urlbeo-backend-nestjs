import {
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

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
  @IsInt()
  @Min(0)
  position!: number;
}
