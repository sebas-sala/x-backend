import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { Comment } from './entities/comment.entity';

import { PostsService } from '../posts/posts.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    private readonly postService: PostsService,
  ) {}

  async createPostComment(
    id: string,
    createCommentDto: CreateCommentDto,
    currentUser: User,
  ) {
    const post = await this.postService.findPostByIdOrFail(id);

    const comment = this.commentRepository.create({
      ...createCommentDto,
      post,
      user: { id: currentUser.id },
    });
    return await this.commentRepository.save(comment);
  }

  async createCommentReply(
    id: string,
    createCommentDto: CreateCommentDto,
    currentUser: User,
  ) {
    const parentComment = await this.findCommentByIdOrFail(id);

    const comment = this.commentRepository.create({
      ...createCommentDto,
      user: { id: currentUser.id },
      parent: parentComment,
    });
    return await this.commentRepository.save(comment);
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    currentUser: User,
  ) {
    const comment = await this.findCommentByIdAndUserOrFail(id, currentUser);
    await this.commentRepository.update(comment.id, updateCommentDto);

    return await this.commentRepository.findOneBy({ id: comment.id });
  }

  async findAll(
    entityId: string,
    entityType: 'post' | 'comment',
  ): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: {
        [entityType]: { id: entityId },
      },
      relations: ['user'],
    });
  }

  async deleteComment(id: string, currentUser: User): Promise<void> {
    const comment = await this.findCommentByIdAndUserOrFail(id, currentUser);

    await this.commentRepository.remove(comment);
  }

  async findCommentByIdAndUserOrFail(
    id: string,
    user: User,
    error?: string,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOneBy({
      id,
      user: { id: user.id },
    });

    if (!comment) {
      throw new NotFoundException(error || 'Comment not found');
    }

    return comment;
  }

  async findCommentByIdOrFail(
    id: string,
    error?: string,
    relations: string[] = [],
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations,
    });

    if (!comment) {
      throw new NotFoundException(error || 'Comment not found');
    }

    return comment;
  }
}
