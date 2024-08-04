import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateFollowDto {
  @IsNotEmpty()
  @IsUUID()
  followerId: string;

  @IsNotEmpty()
  @IsUUID()
  followingId: string;

  constructor(partial?: Partial<CreateFollowDto>) {
    Object.assign(this, partial);
  }
}
