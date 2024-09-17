import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getPostLikes(postId: string): Promise<Like[]> {
    return await this.likeRepository.find({ where: { post: { id: postId } } });
  }

  async likePost(postId: string, userId: string): Promise<Like> {
    try {
      await this.findPostById(postId);
      await this.validateLikeDoesNotExists(postId, userId);
      await this.findPostLike(postId, userId);

      const like = this.likeRepository.create({
        post: { id: postId },
        user: { id: userId },
      });

      return await this.likeRepository.save(like);
    } catch (error) {
      throw error;
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      await this.findPostById(postId);

      const like = await this.likeRepository.findOne({
        where: { post: { id: postId }, user: { id: userId } },
      });

      if (!like) {
        throw new NotFoundException('Like not found');
      }

      await this.likeRepository.delete(like);
    } catch (error) {
      throw error;
    }
  }

  async likeComment(commentId: string, userId: string): Promise<Like> {
    try {
      await this.findCommentById(commentId);
      await this.validateLikeDoesNotExists(userId, undefined, commentId);

      const like = this.likeRepository.create({
        comment: { id: commentId },
        user: { id: userId },
      });

      return await this.likeRepository.save(like);
    } catch (error) {
      throw error;
    }
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    try {
      await this.findCommentById(commentId);

      const like = await this.likeRepository.findOne({
        where: { comment: { id: commentId }, user: { id: userId } },
      });

      if (!like) {
        throw new NotFoundException('Like not found');
      }

      await this.likeRepository.delete(like);
    } catch (error) {
      throw error;
    }
  }

  private async findCommentById(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOneBy({
      id: commentId,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found by id ' + commentId);
    }

    return comment;
  }

  private async findPostById(postId: string): Promise<Post> {
    const post = await this.postRepository.findOneBy({
      id: postId,
    });

    if (!post) {
      throw new NotFoundException('Post not found by id ' + postId);
    }

    return post;
  }

  private async findPostLike(postId: string, userId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (like) {
      throw new ConflictException('Like already exists');
    }
  }

  private async validateLikeDoesNotExists(
    userId: string,
    postId?: string,
    commentId?: string,
  ): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: {
        user: { id: userId },
        ...(postId && { post: { id: postId } }),
        ...(commentId && { comment: { id: commentId } }),
      },
    });

    if (like) {
      throw new ConflictException('Like already exists');
    }
  }
}
