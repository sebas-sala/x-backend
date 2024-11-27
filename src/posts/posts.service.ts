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
    let parent: Post | undefined;

    if (createPostDto.parentId) {
      parent = (await this.findPostById(createPostDto.parentId)) || undefined;
    }

    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: currentUser.id },
      parent,
      isReply: !!parent,
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
    const query = this.postRepository.createQueryBuilder('post');

    this.selectProfile(query);
    this.selectLikesCount(query);
    this.selectIsLiked(query, currentUser);
    this.selectIsFollowed(query, currentUser);
    this.selectIsBookmarked(query, currentUser);

    this.applyFilters(query, filters, currentUser);

    const { data, meta, raw } = await this.paginationService.paginate({
      query,
      ...pagination,
    });

    const transformedData = data.map((post) => {
      const rawItem = raw.find((item: any) => item.post_id === post.id);

      if (rawItem) {
        post.user.isFollowed = rawItem.isFollowed === 1;
        post.isLiked = rawItem.isLiked === 1;
        post.likesCount = rawItem.likesCount;
        post.isBookmarked = rawItem.isBookmarked === 1;
      }

      return post;
    });

    return {
      data: transformedData,
      meta,
    };
  }

  async findOne({
    id,
    currentUser,
  }: {
    id: string;
    currentUser?: User;
  }): Promise<Post> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.id = :id', { id });

    this.selectProfile(query);
    this.selectLikesCount(query);
    this.selectIsLiked(query, currentUser);
    this.selectIsFollowed(query, currentUser);
    this.selectIsBookmarked(query, currentUser);

    this.byBlockedUsersFilter(query, currentUser);

    const post = await query.getOne();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const rawItem = await query.getRawOne();

    if (rawItem) {
      post.user.isFollowed = rawItem.isFollowed === 1;
      post.isLiked = rawItem.isLiked === 1;
      post.likesCount = rawItem.likesCount;
      post.isBookmarked = rawItem.isBookmarked === 1;
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

  private applyFilters(
    query: SelectQueryBuilder<Post>,
    filters: FilterDto,
    currentUser?: User,
  ): void {
    this.byUsernameFilter(query, filters.by_username);
    this.byFollowingFilter(query, filters.by_following, currentUser);
    this.byBookmarked(query, filters.by_bookmarked, currentUser);
    this.byLikeFilter(query, filters.by_like, currentUser);
    this.byBlockedUsersFilter(query, currentUser);
    this.byParentFilter(query, filters.by_parent);
  }

  private byUsernameFilter(query: SelectQueryBuilder<Post>, username?: string) {
    if (!username) return;
    query.andWhere('user.username = :username', { username });
  }

  private byParentFilter(query: SelectQueryBuilder<Post>, parentId?: string) {
    if (!parentId) return;
    query.andWhere('post.parentId = :parentId', { parentId });
  }

  private byLikeFilter(
    query: SelectQueryBuilder<Post>,
    byLike?: boolean,
    currentUser?: User,
  ) {
    if (!byLike) return;
    query
      .innerJoin('like', 'like', 'like.postId = post.id')
      .andWhere('like.userId = :userId')
      .setParameter('userId', currentUser?.id);
  }

  private byBookmarked(
    query: SelectQueryBuilder<Post>,
    byBookmarked?: boolean,
    currentUser?: User,
  ) {
    if (!byBookmarked) return;
    query
      .innerJoin('bookmark', 'bookmark', 'bookmark.postId = post.id')
      .andWhere('bookmark.userId = :userId')
      .setParameter('userId', currentUser?.id);
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
        .where(
          '(blockedUser.blockingUserId = :userId AND blockedUser.blockedUserId = user.id) OR (blockedUser.blockedUserId = :userId AND blockedUser.blockingUserId = user.id)',
          { userId: currentUser.id },
        )
        .getQuery();

      return `NOT EXISTS ${subQuery}`;
    });
  }

  private async selectProfile(query: SelectQueryBuilder<Post>) {
    query
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');
  }

  private async selectIsFollowed(
    query: SelectQueryBuilder<Post>,
    currentUser?: User,
  ) {
    if (!currentUser) return;

    query.addSelect(
      `CASE WHEN EXISTS (
        SELECT 1
        FROM follow
        WHERE follow.followerId = :currentUserId
        AND follow.followingId = user.id
      ) THEN 1 ELSE 0 END`,
      'isFollowed',
    );
    query.setParameter('currentUserId', currentUser.id);
  }

  private async selectIsLiked(
    query: SelectQueryBuilder<Post>,
    currentUser?: User,
  ) {
    if (!currentUser) return;

    query.addSelect(
      `CASE WHEN EXISTS (
        SELECT 1
        FROM like
        WHERE like.userId = :currentUserId
        AND like.postId = post.id
      ) THEN 1 ELSE 0 END`,
      'isLiked',
    );
    query.setParameter('currentUserId', currentUser.id);
  }

  private async selectIsBookmarked(
    query: SelectQueryBuilder<Post>,
    currentUser?: User,
  ) {
    if (!currentUser) return;

    query.addSelect(
      `CASE WHEN EXISTS (
        SELECT 1
        FROM bookmark
        WHERE bookmark.userId = :currentUserId
        AND bookmark.postId = post.id
      ) THEN 1 ELSE 0 END`,
      'isBookmarked',
    );
    query.setParameter('currentUserId', currentUser.id);
  }

  private async selectLikesCount(query: SelectQueryBuilder<Post>) {
    query.addSelect(
      `(SELECT COUNT(*)
        FROM like
        WHERE like.postId = post.id)`,
      'likesCount',
    );
  }
}
