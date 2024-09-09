import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @MaxLength(255)
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  content: string;

  constructor(createCommentDto: Partial<CreateCommentDto>) {
    Object.assign(this, createCommentDto);
  }
}
