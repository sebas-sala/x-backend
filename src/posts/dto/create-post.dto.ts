import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(280)
  content: string;

  constructor(createPostDto: Partial<CreatePostDto>) {
    Object.assign(this, createPostDto);
  }
}
