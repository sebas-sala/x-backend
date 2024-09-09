import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { BlockedUser } from '../blocked-users/entities/blocked-user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const post = this.postRepository.create(createPostDto);
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

  async update(id: string, updatePostDto: UpdatePostDto) {
    try {
      // THIS CODE ONLY WORKS WITH POSTGRES
      // const result = await this.postRepository
      //   .createQueryBuilder()
      //   .update(Post)
      //   .set({ ...updatePostDto })
      //   .where('id = :id', { id })
      //   .execute();
      // const updatedPost = result.raw[0];
      // if (!updatedPost) {
      //   throw new NotFoundException('Post not found');
      // }
      // return updatedPost;

      await this.findPostById(id);
      await this.postRepository.update(id, updatePostDto);
      return await this.findPostById(id);
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
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
