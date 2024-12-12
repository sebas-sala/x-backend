import {
  IsBase64,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(280)
  content: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsOptional()
  @IsString()
  image?: string;

  constructor(createPostDto: Partial<CreatePostDto>) {
    Object.assign(this, createPostDto);
  }
}
