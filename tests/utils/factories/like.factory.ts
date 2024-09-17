import { Like } from '@/src/likes/entities/like.entity';
import { DataSource } from 'typeorm';

export default class LikeFactory {
  constructor(private readonly dataSource?: DataSource) {}

  async createPostLike(postId: string, userId: string) {
    if (!this.dataSource) {
      throw new Error('DataSource not found');
    }
    if (!postId) {
      throw new Error('postId not found');
    }
    if (!userId) {
      throw new Error('userId not found');
    }

    try {
      const likesRepository = this.dataSource.getRepository(Like);

      const like = likesRepository.create({
        post: { id: postId },
        user: { id: userId },
      });

      return await likesRepository.save(like);
    } catch (error) {
      throw error;
    }
  }

  async createCommentLike(commentId: string, userId: string) {
    if (!this.dataSource) {
      throw new Error('DataSource not found');
    }
    if (!commentId) {
      throw new Error('commentId not found');
    }
    if (!userId) {
      throw new Error('userId not found');
    }

    try {
      const likesRepository = this.dataSource.getRepository(Like);

      const like = likesRepository.create({
        comment: { id: commentId },
        user: { id: userId },
      });

      return await likesRepository.save(like);
    } catch (error) {
      throw error;
    }
  }
}
