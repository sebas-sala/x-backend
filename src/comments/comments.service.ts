import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Post } from '../posts/entities/post.entity';

import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createPostComment(
    id: string,
    createCommentDto: CreateCommentDto,
    currentUser: string,
  ) {
    try {
      const post = await this.findPostById(id);

      const comment = this.commentRepository.create({
        ...createCommentDto,
        post,
        user: { id: currentUser },
      });

      return await this.commentRepository.save(comment);
    } catch (error) {
      throw error;
    }
  }

  async findAllPostComments(id: string) {
    try {
      await this.findPostById(id);

      return await this.commentRepository.find({
        where: {
          post: { id },
        },
        relations: ['user'],
      });
    } catch (error) {
      throw error;
    }
  }

  private async findPostById(id: string) {
    const post = await this.postRepository.findOneBy({
      id,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }
}
