import { Injectable } from '@nestjs/common';
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

  create(createPostDto: CreatePostDto) {
    return 'This action adds a new post';
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
          .select('blockedUser.blockingUserId')
          .from(BlockedUser, 'blockedUser')
          .where('blockedUser.blockedUserId = :userId', { userId: currentUser })
          .getQuery();

        return 'user.id NOT IN ' + subQuery;
      });
    }

    return await query.getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
