import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikesService } from '../likes/likes.service';

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
    @CurrentUser() currentUser: string,
  ) {
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
    @CurrentUser() currentUser: string,
  ) {
    return this.commentsService.createCommentReply(
      id,
      createCommentDto,
      currentUser,
    );
  }

  @Get(':id/likes')
  getCommentLikes(@Param('id') id: string) {
    return this.likesService.getCommentLikes(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/likes')
  likeComment(@Param('id') id: string, @CurrentUser() currentUser: string) {
    return this.likesService.likeComment(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/likes')
  unlikeComment(@Param('id') id: string, @CurrentUser() currentUser: string) {
    return this.likesService.unlikeComment(id, currentUser);
  }
}
