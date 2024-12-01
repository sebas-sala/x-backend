import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateViewDto {
  @IsUUID()
  @IsNotEmpty()
  postId: string;
}
