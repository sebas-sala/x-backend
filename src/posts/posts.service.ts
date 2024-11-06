import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { BlockedUser } from '../blocked-users/entities/blocked-user.entity';

import { PaginationService } from '../common/services/pagination.service';

import { FilterDto } from './dto/filter.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly paginationService: PaginationService,
  ) {}

  async create(createPostDto: CreatePostDto, currentUser: User) {
    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: currentUser.id },
    });

    return await this.postRepository.save(post);
  }

  async findAll({
    filters,
    pagination,
    currentUser,
  }: {
    filters: FilterDto;
    pagination: PaginationDto;
    currentUser?: User;
  }) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .addSelect(
        `CASE WHEN EXISTS (
          SELECT 1
          FROM follow
          WHERE follow.followerId = :currentUserId
          AND follow.followingId = user.id
        ) THEN 1 ELSE 0 END`,
        'user_isFollowed',
      )
      .setParameter('currentUserId', currentUser?.id);

    this.applyFilters(query, filters, currentUser);

    const { data, meta, raw } = await this.paginationService.paginate({
      query,
      ...pagination,
    });

    const transformedData = data.map((post) => {
      const rawItem = raw.find((item: any) => item.post_id === post.id);

      if (rawItem) {
        post.user.isFollowed = rawItem.user_isFollowed === 1;
      }

      return post;
    });

    return {
      data: transformedData,
      meta,
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'user.profile'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, author: User) {
    const result = await this.postRepository.update(
      { id, user: { id: author.id } },
      updatePostDto,
    );

    if (result.affected === 0) {
      throw new NotFoundException('Post not found');
    }

    return await this.findPostById(id);
  }

  async remove(id: string, author: User) {
    const result = await this.postRepository.delete({
      id,
      user: { id: author.id },
    });

    if (result.affected === 0) {
      throw new NotFoundException('Post not found');
    }

    return result;
  }

  async findPostByIdOrFail(
    id: string,
    relations: string[] = [],
    error?: string,
  ) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations,
    });

    if (!post) {
      throw new NotFoundException(error || 'Post not found');
    }

    return post;
  }

  async findPostById(
    id: string,
    relations: string[] = [],
  ): Promise<Post | null> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations,
    });

    return post;
  }

  private async executeQuery(
    query: SelectQueryBuilder<Post>,
    limit: number,
    skip: number,
  ) {
    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
    return { data, total };
  }

  private applyFilters(
    query: SelectQueryBuilder<Post>,
    filters: FilterDto,
    currentUser?: User,
  ): void {
    this.byUsernameFilter(query, filters.by_username);
    this.byFollowingFilter(query, filters.by_following, currentUser);
    // this.byBlockedUsersFilter(query, currentUser);
  }

  private byUsernameFilter(query: SelectQueryBuilder<Post>, username?: string) {
    if (!username) return;
    query.andWhere('user.username = :username', { username });
  }

  private async byFollowingFilter(
    query: SelectQueryBuilder<Post>,
    byFollowing?: boolean,
    currentUser?: User,
  ) {
    if (!byFollowing) return;
    if (!currentUser) return query.andWhere('1 = 0');

    query
      .innerJoin('Follow', 'follow', 'follow.followerId = :userId')
      .innerJoin('follow.following', 'following')
      .andWhere('following.id = post.userId')
      .setParameter('userId', currentUser.id);
  }

  private byBlockedUsersFilter(
    query: SelectQueryBuilder<Post>,
    currentUser?: User,
  ) {
    if (!currentUser) return;
    query.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(BlockedUser, 'blockedUser')
        .where('blockedUser.blockedUserId = :userId', {
          userId: currentUser.id,
        })
        .andWhere('blockedUser.blockingUserId = user.id')
        .getQuery();

      return `NOT EXISTS ${subQuery}`;
    });
  }
}
