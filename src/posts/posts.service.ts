import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { BlockedUser } from '../blocked-users/entities/blocked-user.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto, currentUser: User) {
    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: currentUser.id },
    });

    return await this.postRepository.save(post);
  }

  async findAll(currentUser?: User) {
    const query = this.createBaseFindAllQuery();

    if (currentUser) {
      this.applyBlockedUsersFilter(query, currentUser);
    }

    return await query.getMany();
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

  private createBaseFindAllQuery() {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');
  }

  private applyBlockedUsersFilter(
    query: SelectQueryBuilder<Post>,
    currentUser: User,
  ): void {
    query.where((qb) => {
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
