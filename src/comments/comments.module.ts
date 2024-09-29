import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';

import { PostsModule } from '../posts/posts.module';
import { LikesModule } from '../likes/likes.module';

import { Post } from '../posts/entities/post.entity';
import { Comment } from './entities/comment.entity';

import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  providers: [CommentsService],
  imports: [
    TypeOrmModule.forFeature([Comment, Post]),
    forwardRef(() => LikesModule),
    forwardRef(() => PostsModule),
  ],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
