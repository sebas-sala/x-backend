import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';

import { PaginationService } from '../common/services/pagination.service';

import { FilterDto } from './dto/filter.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StorageService } from '../common/services/storage.service';
import { File } from '@nest-lab/fastify-multer';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly paginationService: PaginationService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly logger = new Logger(PostsService.name);

  async createImagePost(file?: File, currentUser?: User) {
    if (!file || !currentUser) return;

    const imageBuffer = file.buffer;
    const contentType = file.mimetype;
    const fileName = `${currentUser.id}/${file.originalname}`;

    return await this.storageService.uploadImage({
      fileName,
      contentType,
      fileBuffer: imageBuffer,
    });
  }

  async create(createPostDto: CreatePostDto, currentUser: User, file?: File) {
    const parent = createPostDto.parentId
      ? await this.findPostByIdOrFail(createPostDto.parentId)
      : undefined;

    const imageUrl = await this.createImagePost(file, currentUser);

    const postData = {
      content: createPostDto.content,
      user: { id: currentUser?.id },
      parent: parent,
      isReply: !!createPostDto.parentId,
      image_url: imageUrl,
    };

    const post = this.postRepository.create(postData);
    const savedPost = await this.postRepository.save(post);

    await this.createPostNotification(savedPost, currentUser);

    return savedPost;
  }

  async findAll({
    filters,
    pagination,
    currentUser,
    orderBy,
  }: {
    filters: FilterDto;
    pagination: PaginationDto;
    orderBy: string;
    currentUser?: User;
  }) {
    const query = this.postRepository.createQueryBuilder('post');

    this.applySelects(query, currentUser);
    this.applyFilters(query, filters, currentUser);
    this.applyOrderBy(query, orderBy);

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
        post.isViewed = rawItem.isViewed === 1;
        post.viewsCount = rawItem.viewsCount;
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

    this.applySelects(query, currentUser);

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
      post.isViewed = rawItem.isViewed === 1;
      post.viewsCount = rawItem.viewsCount;
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
    this.byReplyFilter(query, filters.by_reply);
    this.byParentFilter(query, filters.by_parent);
  }

  private applyOrderBy(query: SelectQueryBuilder<Post>, orderBy: string) {
    if (orderBy === 'trending') {
      return this.orderByViewsCount(query);
    } else if (orderBy === 'createdAt') {
      query.orderBy('post.createdAt', 'DESC');
    }
  }

  private applySelects(query: SelectQueryBuilder<Post>, currentUser?: User) {
    this.selectProfile(query);
    this.selectLikesCount(query);
    this.selectIsLiked(query, currentUser);
    this.selectIsFollowed(query, currentUser);
    this.selectIsBookmarked(query, currentUser);
    this.selectIsViewed(query, currentUser);
    this.selectViewsCount(query);
  }

  private async orderByViewsCount(query: SelectQueryBuilder<Post>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    query
      .leftJoin('post.views', 'postViews', 'postViews.createdAt >= :today')
      .addSelect('COUNT(postViews.id)', 'viewsToday')
      .groupBy('post.id')
      .orderBy('viewsToday', 'DESC')
      .setParameter('today', today);
  }

  private byUsernameFilter(query: SelectQueryBuilder<Post>, username?: string) {
    if (!username) return;
    query.andWhere('user.username = :username', { username });
  }

  private byReplyFilter(query: SelectQueryBuilder<Post>, isReply?: boolean) {
    query.andWhere('post.isReply = :isReply', { isReply });
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

  private async createPostNotification(post: Post, currentUser: User) {
    if (!post.parent || !post.isReply) return;

    try {
      return await this.notificationsService.create({
        type: 'comment',
        title: 'New comment',
        sender: currentUser.id,
        receivers: [post.user.id],
        message: `@${currentUser.username} comment your post`,
        entityId: post.id,
        entityType: 'comment',
      });
    } catch (error) {
      this.logger.error(error.message);
    }
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

    query.andWhere(
      `NOT EXISTS (
        SELECT 1
        FROM blocked_user
        WHERE (blocked_user.blockingUserId = :userId AND blocked_user.blockedUserId = user.id)
        OR (blocked_user.blockedUserId = :userId AND blocked_user.blockingUserId = user.id)
      )`,
      { userId: currentUser.id },
    );
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

  private async selectIsViewed(
    query: SelectQueryBuilder<Post>,
    currentUser?: User,
  ) {
    if (!currentUser) return;

    query.addSelect(
      `CASE WHEN EXISTS (
        SELECT 1
        FROM view
        WHERE view.userId = :currentUserId
        AND view.postId = post.id
      ) THEN 1 ELSE 0 END`,
      'isViewed',
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

  private async selectViewsCount(query: SelectQueryBuilder<Post>) {
    query.addSelect(
      `(SELECT COUNT(*)
        FROM view
        WHERE view.postId = post.id)`,
      'viewsCount',
    );
  }
}
