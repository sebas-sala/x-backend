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
    const post = this.postRepository.create({
      ...createPostDto,
      user: { id: currentUser.id },
    });

    return await this.postRepository.save(post);
  }

  async findAll({
    filters,
    pagination,
    currentUser,
  }: {
    filters: FilterDto;
    pagination: { page: number; limit: number };
    currentUser?: User;
  }): Promise<{ data: Post[]; meta: { pagination: PaginationDto } }> {
    const { page, skip, limit } = this.paginationService.paginate(pagination);

    const query = this.createQuery();

    this.applyFilters(query, filters, currentUser);

    const { data, total } = await this.executeQuery(query, limit, skip);

    return {
      data,
      meta: {
        pagination: this.paginationService.metaPagination(page, limit, total),
      },
    };
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

  private createQuery() {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .cache(false);
  }

  private async executeQuery(
    query: SelectQueryBuilder<Post>,
    limit: number,
    skip: number,
  ) {
    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();
    return { data, total };
  }

  private applyFilters(
    query: SelectQueryBuilder<Post>,
    filters: FilterDto,
    currentUser?: User,
  ): void {
    this.byUsernameFilter(query, filters.by_username);
    this.byBlockedUsersFilter(query, currentUser);
  }

  private byUsernameFilter(query: SelectQueryBuilder<Post>, username?: string) {
    if (!username) return;
    query.andWhere('user.username = :username', { username });
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
        .where('blockedUser.blockedUserId = :userId', {
          userId: currentUser.id,
        })
        .andWhere('blockedUser.blockingUserId = user.id')
        .getQuery();

      return `NOT EXISTS ${subQuery}`;
    });
  }
}
