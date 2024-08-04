import { CreateFollowDto } from '@/src/follows/dto/create-follow.dto';
import { DeleteFollowDto } from '@/src/follows/dto/delete-follow.dto';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';

export default class FollowFactory {
  constructor(private readonly dataSource?: DataSource) {}

  static createFollowDto({
    followingId,
    followerId,
  }: Partial<CreateFollowDto> = {}): CreateFollowDto {
    const createFollowDto: CreateFollowDto = new CreateFollowDto({
      followingId: followingId || faker.string.uuid(),
      followerId: followerId || faker.string.uuid(),
    });

    return createFollowDto;
  }

  static deleteFollowDto({
    followingId,
    followerId,
  }: Partial<DeleteFollowDto> = {}): DeleteFollowDto {
    const deleteFollowDto: DeleteFollowDto = new DeleteFollowDto({
      followingId: followingId || faker.string.uuid(),
      followerId: followerId || faker.string.uuid(),
    });

    return deleteFollowDto;
  }
}
