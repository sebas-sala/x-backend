import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Follow } from './entities/follow.entity';
import { CreateFollowDto } from './dto/create-follow.dto';
import { DeleteFollowDto } from './dto/delete-follow.dto';

import { UsersService } from '@/src/users/users.service';

@Injectable()
export class FollowService {
  private readonly ERROR_MESSAGES = {
    FOLLOWER_NOT_FOUND: 'Follower not found',
    FOLLOWING_NOT_FOUND: 'Following not found',
    FOLLOW_ALREADY_EXISTS: 'Follow already exists',
  };

  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    private readonly usersService: UsersService,
  ) {}

  async create(createFollowDto: CreateFollowDto) {
    const { followerId, followingId } = createFollowDto;

    const { follower, following } = await this.findUsers(
      followerId,
      followingId,
    );

    await this.validateFollowDoesNotExist(followerId, followingId);

    const follow = this.followRepository.create({
      follower,
      following,
    });

    return await this.followRepository.save(follow);
  }

  async remove(deleteFollowDto: DeleteFollowDto) {
    const { followerId, followingId } = deleteFollowDto;

    await this.validateFollowExists(followerId, followingId);

    const result = await this.deleteFollow(followerId, followingId);

    return result;
  }

  private async deleteFollow(followerId: string, followingId: string) {
    console.log('followerId', followerId);

    const result = await this.followRepository
      .createQueryBuilder()
      .delete()
      .from(Follow)
      .where('followerId = :followerId AND followingId = :followingId', {
        followerId,
        followingId,
      })
      .execute();

    return result.affected;
  }

  private async validateFollowDoesNotExist(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const existingFollow = await this.findFollow(followerId, followingId);

    if (existingFollow) {
      throw new ConflictException(this.ERROR_MESSAGES.FOLLOW_ALREADY_EXISTS);
    }
  }

  private async validateFollowExists(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const existingFollow = await this.findFollow(followerId, followingId);

    if (!existingFollow) {
      throw new NotFoundException('Follow not found');
    }
  }

  private async findUsers(followerId: string, followingId: string) {
    const [follower, following] = await Promise.all([
      this.usersService.findOneBy({
        options: { id: followerId },
        error: this.ERROR_MESSAGES.FOLLOWER_NOT_FOUND,
      }),
      this.usersService.findOneBy({
        options: { id: followingId },
        error: this.ERROR_MESSAGES.FOLLOWING_NOT_FOUND,
      }),
    ]);

    return { follower, following };
  }

  private async findFollow(
    followerId: string,
    followingId: string,
  ): Promise<Follow | null> {
    return this.followRepository
      .createQueryBuilder()
      .where('followerId = :followerId AND followingId = :followingId', {
        followerId,
        followingId,
      })
      .getOne();
  }
}
