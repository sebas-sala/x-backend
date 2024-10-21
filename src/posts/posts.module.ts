import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LikesModule } from '../likes/likes.module';
import { CommentsModule } from '../comments/comments.module';

import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

import { ResponseService } from '../common/services/response.service';
import { PaginationService } from '../common/services/pagination.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, ResponseService, PaginationService],
  imports: [
    TypeOrmModule.forFeature([Post]),
    forwardRef(() => CommentsModule),
    forwardRef(() => LikesModule),
  ],
  exports: [TypeOrmModule, PostsService],
})
export class PostsModule {}
