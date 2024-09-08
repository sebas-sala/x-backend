import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateFollowDto {
  @IsNotEmpty()
  @IsUUID()
  followingId: string;

  @IsOptional()
  @IsUUID()
  followerId: string;

  constructor(partial?: Partial<CreateFollowDto>) {
    Object.assign(this, partial);
  }
}
