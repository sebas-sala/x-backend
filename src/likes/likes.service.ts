import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Like } from './entities/like.entity';
import { User } from '../users/entities/user.entity';

import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,

    private readonly postService: PostsService,
    private readonly commentService: CommentsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async getPostLikes(postId: string): Promise<Like[]> {
    return await this.likeRepository.find({
      where: { post: { id: postId } },
    });
  }

  async getCommentLikes(commentId: string): Promise<Like[]> {
    return await this.likeRepository.find({
      where: { comment: { id: commentId } },
    });
  }

  async likePost(postId: string, currentUser: User): Promise<Like> {
    const post = await this.postService.findPostByIdOrFail(postId);
    await this.validateLikeDoesNotExists('post', postId, currentUser.id);

    const like = this.likeRepository.create({
      post: { id: postId },
      user: { id: currentUser.id },
    });

    const savedLike = await this.likeRepository.save(like);

    try {
      await this.notificationsService.create({
        type: 'like',
        title: 'New like',
        sender: currentUser.id,
        receivers: [post.user.id],
        message: `${currentUser.username} liked your post`,
      });
    } catch (error) {
      console.log(error);
    }

    return savedLike;
  }

  async unlikePost(postId: string, currentUser: User): Promise<void> {
    await this.postService.findPostByIdOrFail(postId);

    const like = await this.findLikeByEntityAndUserOrFail(
      'post',
      postId,
      currentUser.id,
    );
    await this.likeRepository.delete(like);
  }

  async likeComment(commentId: string, user: User): Promise<Like> {
    await this.commentService.findCommentByIdOrFail(commentId);
    await this.validateLikeDoesNotExists('comment', commentId, user.id);

    const like = this.likeRepository.create({
      comment: { id: commentId },
      user: { id: user.id },
    });
    return await this.likeRepository.save(like);
  }

  async unlikeComment(commentId: string, user: User): Promise<void> {
    await this.commentService.findCommentByIdOrFail(commentId);

    const like = await this.findLikeByEntityAndUserOrFail(
      'comment',
      commentId,
      user.id,
    );
    await this.likeRepository.delete(like);
  }

  async findLikeByEntityAndUser(
    entityType: 'post' | 'comment',
    entityId: string,
    userId: string,
  ): Promise<Like | null> {
    return await this.likeRepository.findOne({
      where: { [entityType]: { id: entityId }, user: { id: userId } },
    });
  }

  async findLikeByEntityAndUserOrFail(
    entityType: 'post' | 'comment',
    entityId: string,
    userId: string,
    error?: string,
  ): Promise<Like> {
    const like = await this.likeRepository.findOne({
      where: { [entityType]: { id: entityId }, user: { id: userId } },
    });

    if (!like) {
      throw new NotFoundException(error || 'Like not found');
    }

    return like;
  }

  private async validateLikeDoesNotExists(
    entityType: 'post' | 'comment',
    entityId: string,
    userId: string,
  ): Promise<void> {
    const like = await this.likeRepository.exists({
      where: { [entityType]: { id: entityId }, user: { id: userId } },
    });

    if (like) {
      throw new ConflictException('Like already exists');
    }
  }
}
