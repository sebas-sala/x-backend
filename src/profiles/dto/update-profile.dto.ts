import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @MaxLength(50)
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  // @IsOptional()
  // @IsString()
  // avatarUrl?: string;
}
