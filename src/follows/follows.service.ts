import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';

import { CreateFollowDto } from './dto/create-follow.dto';
import { DeleteFollowDto } from './dto/delete-follow.dto';

import { UsersService } from '@/src/users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PaginatedResult,
  PaginationService,
} from '../common/services/pagination.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class FollowService {
  private readonly ERROR_MESSAGES = {
    FOLLOWER_NOT_FOUND: 'Follower not found',
    FOLLOWING_NOT_FOUND: 'Following not found',
    FOLLOW_ALREADY_EXISTS: 'Follow already exists',
  };

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly paginationService: PaginationService,
  ) {}

  async getFollowing({
    username,
    paginationDto,
    currentUser,
  }: {
    username: string;
    paginationDto: PaginationDto;
    currentUser: User;
  }) {
    const user = await this.usersService.findOneByUsernameOrFail({
      username,
    });

    const query = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.following', 'follow', 'follow.followerId = :userId')
      .setParameters({ userId: user.id })
      .leftJoinAndSelect('user.profile', 'profile')
      .addSelect(
        `CASE WHEN EXISTS (
          SELECT 1
          FROM follow
          WHERE follow.followerId = :currentUserId
          AND follow.followingId = user.id
        ) THEN 1 ELSE 0 END`,
        'isFollowed',
      )
      .setParameter('currentUserId', currentUser?.id);

    const { data, meta, raw } = await this.paginationService.paginate({
      query,
      ...paginationDto,
    });

    for (const user of data) {
      const rawItem = raw.find((item: any) => item.user_id === user.id);

      if (rawItem) {
        user.isFollowed = rawItem.isFollowed === 1;
      }
    }

    return {
      data,
      meta,
    };
  }

  async getFollowers({
    username,
    paginationDto,
    currentUser,
  }: {
    username: string;
    paginationDto: PaginationDto;
    currentUser: User;
  }) {
    const user = await this.usersService.findOneByUsernameOrFail({
      username,
    });

    const query = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(
        'user.followers',
        'followers',
        'followers.followingId = :userId',
      )
      .setParameters({ userId: user.id })
      .leftJoinAndSelect('user.profile', 'profile')
      .addSelect(
        `CASE WHEN EXISTS (
          SELECT 1
          FROM follow
          WHERE follow.followerId = :currentUserId
          AND follow.followingId = user.id
        ) THEN 1 ELSE 0 END`,
        'isFollowed',
      )
      .setParameter('currentUserId', currentUser?.id);

    const { data, meta, raw } = await this.paginationService.paginate({
      query,
      ...paginationDto,
    });

    for (const user of data) {
      const rawItem = raw.find((item: any) => item.user_id === user.id);

      if (rawItem) {
        user.isFollowed = rawItem.isFollowed === 1;
      }
    }

    return {
      data,
      meta,
    };
  }

  async create(followingId: string, currentUser: User): Promise<Follow> {
    if (followingId === currentUser.id) {
      throw new ConflictException('You cannot follow yourself');
    }

    const following = await this.validateFollowingExists(followingId);
    await this.validateFollowDoesNotExist(currentUser.id, followingId);

    const follow = this.followRepository.create({
      follower: currentUser,
      following,
    });
    const savedFollow = await this.followRepository.save(follow);

    try {
      await this.notificationsService.create({
        type: 'follow',
        title: 'New follower',
        sender: currentUser.id,
        receivers: [followingId],
        message: `${currentUser.username} started following you`,
      });
    } catch (error) {
      console.error(error);
    }

    return savedFollow;
  }

  async remove(followingId: string, currentUser: User) {
    await this.validateFollowExists(currentUser.id, followingId);

    return await this.deleteFollow(currentUser.id, followingId);
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

  private async validateFollowDoesNotExist(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const existingFollow = await this.existsFollowByUsers(
      followerId,
      followingId,
    );

    if (existingFollow) {
      throw new ConflictException(this.ERROR_MESSAGES.FOLLOW_ALREADY_EXISTS);
    }
  }

  private async validateFollowExists(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const existingFollow = await this.existsFollowByUsers(
      followerId,
      followingId,
    );

    if (!existingFollow) {
      throw new NotFoundException('Follow not found');
    }
  }

  private async validateFollowingExists(followingId: string): Promise<User> {
    return await this.usersService.findOneByIdOrFail({
      id: followingId,
      error: this.ERROR_MESSAGES.FOLLOWING_NOT_FOUND,
    });
  }

  private async existsFollowByUsers(followerId: string, followingId: string) {
    return await this.followRepository.existsBy({
      follower: { id: followerId },
      following: { id: followingId },
    });
  }
}
