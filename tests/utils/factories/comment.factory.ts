import { CreateCommentDto } from '@/src/comments/dto/create-comment.dto';
import { Comment } from '@/src/comments/entities/comment.entity';
import { Post } from '@/src/posts/entities/post.entity';
import { User } from '@/src/users/entities/user.entity';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import UserFactory from './user.factory';
import PostFactory from './post.factory';

export default class CommentFactory {
  constructor(private readonly dataSource?: DataSource) {}

  static createCommentDto({
    content,
  }: Partial<CreateCommentDto> = {}): CreateCommentDto {
    const createCommentDto: CreateCommentDto = new CreateCommentDto({
      content: content || faker.lorem.paragraph(),
    });

    return createCommentDto;
  }

  async createComment({
    content,
    postId,
    userId,
  }: {
    content?: string;
    postId: string;
    userId: string;
  }): Promise<Comment> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a Comment entity.');
    }
    if (!postId) {
      throw new Error('Post ID is required to create a Comment entity.');
    }
    if (!userId) {
      throw new Error('User ID is required to create a Comment entity.');
    }

    const createCommentDto = CommentFactory.createCommentDto({ content });

    try {
      const post = await this.dataSource.getRepository(Post).findOneByOrFail({
        id: postId,
      });
      const user = await this.dataSource.getRepository(User).findOneByOrFail({
        id: userId,
      });

      const commentsRepository = this.dataSource.getRepository(Comment);
      const createdComment = commentsRepository.create({
        ...createCommentDto,
        post,
        user,
      });

      return await commentsRepository.save(createdComment);
    } catch (error) {
      throw error;
    }
  }
}
