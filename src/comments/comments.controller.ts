import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { User } from '../users/entities/user.entity';
import { Like } from '../likes/entities/like.entity';
import { Comment } from './entities/comment.entity';

import { LikesService } from '../likes/likes.service';
import { CommentsService } from './comments.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() currentUser: User,
  ): Promise<Comment | null> {
    return this.commentsService.updateComment(
      id,
      updateCommentDto,
      currentUser,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/replies')
  createReply(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    return this.commentsService.createCommentReply(
      id,
      createCommentDto,
      currentUser,
    );
  }

  @Get(':id/likes')
  getCommentLikes(@Param('id') id: string): Promise<Like[]> {
    return this.likesService.getCommentLikes(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/likes')
  likeComment(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<Like> {
    return this.likesService.likeComment(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/likes')
  unlikeComment(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.likesService.unlikeComment(id, currentUser);
  }
}
