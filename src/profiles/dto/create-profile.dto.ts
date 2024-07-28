// create-profile.dto.ts

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  birthdate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string;

  // @IsOptional()
  // @IsString()
  // avatarUrl?: string;
}
