import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { PostsService } from './posts.service';
import { LikesService } from '../likes/likes.service';
import { CommentsService } from '../comments/comments.service';
import { ResponseService } from '../common/services/response.service';

import { FilterDto } from './dto/filter.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtAuthPublicGuard } from '../common/guards/jwt-auth-public.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
    private readonly responseService: ResponseService,
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
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() filters: FilterDto,
    @Query() pagination: PaginationDto,
  ) {
    const { data, meta } = await this.postsService.findAll({
      currentUser,
      pagination,
      filters,
    });

    return this.responseService.successResponse({ data, meta });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.postsService.update(id, updatePostDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.postsService.remove(id, currentUser);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.commentsService.findAll(id, 'post');
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
