import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { CreatePostDto } from '@/src/posts/dto/create-post.dto';
import { Post } from '@/src/posts/entities/post.entity';

interface CreatePost {
  content: string;
  userId: string;
}

export default class PostFactory {
  constructor(private readonly dataSource?: DataSource) {}

  static createPostDto({
    content,
  }: Partial<CreatePostDto> = {}): CreatePostDto {
    const createPostDto: CreatePostDto = new CreatePostDto({
      content: content || faker.lorem.sentence(),
    });

    return createPostDto;
  }

  async createPost({
    content,
    userId,
  }: Partial<CreatePost> = {}): Promise<Post> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a Post entity.');
    }
    if (!userId) {
      throw new Error('User ID is required to create a Post entity.');
    }

    const createPostDto = PostFactory.createPostDto({ content });

    try {
      const postsRepository = this.dataSource.getRepository(Post);

      const createdPost = postsRepository.create({
        ...createPostDto,
        user: { id: userId },
      });

      return await postsRepository.save(createdPost);
    } catch (error) {
      throw error;
    }
  }
}
