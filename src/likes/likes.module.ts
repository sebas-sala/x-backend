import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';

import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';

import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';

@Module({
  controllers: [LikesController],
  providers: [LikesService],
  imports: [
    TypeOrmModule.forFeature([Like, Post]),
    forwardRef(() => PostsModule),
    NotificationsModule,
  ],
  exports: [LikesService],
})
export class LikesModule {}
