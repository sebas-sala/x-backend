import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Like } from './entities/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async getPostLikes(postId: string): Promise<Like[]> {
    return await this.likeRepository.find({ where: { post: { id: postId } } });
  }

  async likePost(postId: string, userId: string): Promise<Like> {
    try {
      await this.findPostById(postId);
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
}
