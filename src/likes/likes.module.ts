import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

@Module({
  controllers: [LikesController],
  providers: [LikesService],
  imports: [TypeOrmModule.forFeature([Like, Post, Comment])],
  exports: [LikesService],
})
export class LikesModule {}
