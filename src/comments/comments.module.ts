import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  providers: [CommentsService],
  imports: [TypeOrmModule.forFeature([Comment, Post])],
  exports: [CommentsService],
})
export class CommentsModule {}
