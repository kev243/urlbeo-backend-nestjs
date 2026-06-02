import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateNameAndBioDto {
  @IsString()
  @MinLength(1, { message: 'Name must be at least 1 characters long' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name!: string;

  @IsString()
  @MinLength(1, { message: 'Bio must be at least 1 characters long' })
  @MaxLength(200, { message: 'Bio cannot exceed 200 characters' })
  bio!: string;
}

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'Username can only contain letters, numbers, and hyphens',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  username!: string;
}
