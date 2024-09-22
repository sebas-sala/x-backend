import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Post } from './entities/post.entity';
import { BlockedUser } from '../blocked-users/entities/blocked-user.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto, currentUser: string) {
    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: currentUser },
    });

    return await this.postRepository.save(post);
  }

  async findAll(currentUser?: string) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');

    if (currentUser) {
      query.where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .select('blockedUser.blockingUserId')
          .from(BlockedUser, 'blockedUser')
          .where('blockedUser.blockedUserId = :userId', { userId: currentUser })
          .andWhere('blockedUser.blockingUserId = user.id')
          .getQuery();

        return `NOT EXISTS ${subQuery}`;
      });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Post> {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['user', 'user.profile'],
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return post;
    } catch (error) {
      throw error;
    }
  }

  async getComments(id: string) {
    return `This action returns comments for a #${id} post`;
  }

  async update(id: string, updatePostDto: UpdatePostDto, authorId: string) {
    try {
      const result = await this.postRepository.update(
        { id, user: { id: authorId } },
        updatePostDto,
      );

      if (result.affected === 0) {
        throw new NotFoundException('Post not found');
      }

      return await this.findPostById(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string, authorId: string) {
    try {
      const result = await this.postRepository.delete({
        id,
        user: { id: authorId },
      });

      if (result.affected === 0) {
        throw new NotFoundException('Post not found');
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  private async findPostById(
    id: string,
    relations: string[] = [],
  ): Promise<Post> {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
        relations,
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return post;
    } catch (error) {
      throw error;
    }
  }
}
