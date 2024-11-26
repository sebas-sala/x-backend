import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { Bookmark } from './entities/bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
  ) {}

  async bookmarkPost(postId: string, currentUser: User) {
    this.validateBookmarkDoesNotExist({
      postId: postId,
      userId: currentUser.id,
    });

    return this.bookmarkRepository.save({
      user: currentUser,
      post: { id: postId },
    });
  }

  async unbookmarkPost(postId: string, currentUser: User) {
    const bookmark = await this.findBookmarkOrFail({
      postId: postId,
      userId: currentUser.id,
    });

    return this.bookmarkRepository.delete(bookmark.id);
  }

  private async validateBookmarkDoesNotExist({
    postId,
    userId,
  }: {
    postId: string;
    userId: string;
  }) {
    const bookmark = await this.findBookmark({
      postId: postId,
      userId: userId,
    });
    if (bookmark) {
      throw new ConflictException('Bookmark already exists');
    }
  }

  private async findBookmark({
    postId,
    userId,
  }: {
    postId: string;
    userId: string;
  }) {
    return this.bookmarkRepository.findOneBy({
      post: { id: postId },
      user: { id: userId },
    });
  }

  private async findBookmarkOrFail({
    postId,
    userId,
  }: {
    postId: string;
    userId: string;
  }) {
    const bookmark = await this.bookmarkRepository.findOneBy({
      post: { id: postId },
      user: { id: userId },
    });
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    return bookmark;
  }
}
