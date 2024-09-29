import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LikesModule } from '../likes/likes.module';
import { CommentsModule } from '../comments/comments.module';

import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [
    TypeOrmModule.forFeature([Post]),
    forwardRef(() => CommentsModule),
    forwardRef(() => LikesModule),
  ],
  exports: [TypeOrmModule, PostsService],
})
export class PostsModule {}
