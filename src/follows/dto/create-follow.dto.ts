import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFollowDto {
  @IsNotEmpty()
  @IsUUID()
  followerId: string;

  @IsNotEmpty()
  @IsUUID()
  followingId: string;
}
