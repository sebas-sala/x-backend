import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFollowDto } from './dto/create-follow.dto';
import { DeleteFollowDto } from './dto/delete-follow.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    private readonly usersService: UsersService,
  ) {}

  async findFollowers(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followers = await this.getFollowers(userId);

    return followers;
  }

  async findFollowing(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const following = await this.getFollowing(userId);

    return following;
  }

  async create(createFollowDto: CreateFollowDto) {
    const { followerId, followingId } = createFollowDto;

    try {
      const follower = await this.usersService.findById(followerId);
      if (!follower) {
        throw new NotFoundException('Follower not found');
      }

      const following = await this.usersService.findById(followingId);
      if (!following) {
        throw new NotFoundException('Following not found');
      }

      const existingFollow = await this.findFollow(followerId, followingId);
      if (existingFollow) {
        throw new ConflictException('Follow already exists');
      }

      const newFollow = this.followRepository.create({
        follower,
        following,
      });

      return await this.followRepository.save(newFollow);
    } catch (error) {
      throw error;
    }
  }

  async remove(deleteFollowDto: DeleteFollowDto) {
    const { followerId, followingId } = deleteFollowDto;

    try {
      const existingFollow = await this.findFollow(followerId, followingId);
      if (!existingFollow) {
        throw new NotFoundException('Follow not found');
      }

      const result = await this.deleteFollow(followerId, followingId);

      return result;
    } catch (error) {
      throw error;
    }
  }

  private async getFollowers(followingId: string) {
    return await this.followRepository
      .createQueryBuilder('user')
      .where('user.followingId = :followingId', { followingId })
      .getMany();
  }

  private async getFollowing(followerId: string) {
    return await this.followRepository
      .createQueryBuilder('user')
      .where('user.followerId = :followerId', { followerId })
      .getMany();
  }

  private async deleteFollow(followerId: string, followingId: string) {
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
