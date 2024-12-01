import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LikesModule } from '../likes/likes.module';

import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

import { ResponseService } from '../common/services/response.service';
import { PaginationService } from '../common/services/pagination.service';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { View } from '../views/entities/view.entity';

@Module({
  controllers: [PostsController],
  providers: [PostsService, ResponseService, PaginationService],
  imports: [
    TypeOrmModule.forFeature([Post, View]),
    forwardRef(() => LikesModule),
    BookmarksModule,
  ],
  exports: [TypeOrmModule, PostsService],
})
export class PostsModule {}
