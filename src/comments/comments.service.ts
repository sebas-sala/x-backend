import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Post } from '../posts/entities/post.entity';

import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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

  async createCommentReply(
    id: string,
    createCommentDto: CreateCommentDto,
    currentUser: string,
  ) {
    try {
      const parentComment = await this.findCommentById(id);

      const comment = this.commentRepository.create({
        ...createCommentDto,
        user: { id: currentUser },
        parent: parentComment,
      });

      return await this.commentRepository.save(comment);
    } catch (error) {
      throw error;
    }
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    currentUser: string,
  ) {
    try {
      const comment = await this.commentRepository.findOneBy({
        id,
        user: { id: currentUser },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      await this.commentRepository.update(comment.id, updateCommentDto);

      return await this.commentRepository.findOneBy({ id: comment.id });
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

  async deleteComment(id: string, currentUser: string) {
    try {
      const comment = await this.commentRepository.findOneBy({
        id,
        user: { id: currentUser },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      await this.commentRepository.remove(comment);
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

  private async findCommentById(id: string) {
    const comment = await this.commentRepository.findOneBy({
      id,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
