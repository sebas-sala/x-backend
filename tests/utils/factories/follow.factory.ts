import { CreateFollowDto } from '@/src/follows/dto/create-follow.dto';
import { DeleteFollowDto } from '@/src/follows/dto/delete-follow.dto';
import { Follow } from '@/src/follows/entities/follow.entity';
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

  async createFollow({
    followingId,
    followerId,
  }: Partial<CreateFollowDto> = {}): Promise<Follow> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a Follow entity.');
    }

    if (!followingId) {
      throw new Error('Following ID is required to create a Follow entity.');
    }

    if (!followerId) {
      throw new Error('Follower ID is required to create a Follow entity.');
    }

    try {
      const followsRepository = this.dataSource.getRepository(Follow);

      const createFollowDto = followsRepository.create({
        follower: { id: followerId },
        following: { id: followingId },
      });

      return await followsRepository.save(createFollowDto);
    } catch (error) {
      throw error;
    }
  }
}
