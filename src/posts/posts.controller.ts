import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { User } from '../users/entities/user.entity';

import { PostsService } from './posts.service';
import { LikesService } from '../likes/likes.service';
import { CommentsService } from '../comments/comments.service';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtAuthPublicGuard } from '../common/guards/jwt-auth-public.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.postsService.create(createPostDto, currentUser);
  }

  @UseGuards(JwtAuthPublicGuard)
  @Get()
  findAll(@CurrentUser() currentUser: User) {
    return this.postsService.findAll(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() currentUser: User,
  ) {
    return await this.postsService.update(id, updatePostDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.postsService.remove(id, currentUser);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.commentsService.findAllPostComments(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.commentsService.createPostComment(
      id,
      createCommentDto,
      currentUser,
    );
  }

  @Get(':id/likes')
  getPostLikes(@Param('id') id: string) {
    return this.likesService.getPostLikes(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/likes')
  likePost(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.likesService.likePost(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/likes')
  unlikePost(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.likesService.unlikePost(id, currentUser);
  }
}
