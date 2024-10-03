import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';

import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';

import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [LikesController],
  providers: [LikesService],
  imports: [
    TypeOrmModule.forFeature([Like, Post, Comment]),
    forwardRef(() => PostsModule),
    forwardRef(() => CommentsModule),
    NotificationsModule,
  ],
  exports: [LikesService],
})
export class LikesModule {}
