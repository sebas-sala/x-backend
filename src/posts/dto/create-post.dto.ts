import {
  IsNotEmpty,
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
  parentId?: string;

  constructor(createPostDto: Partial<CreatePostDto>) {
    Object.assign(this, createPostDto);
  }
}
