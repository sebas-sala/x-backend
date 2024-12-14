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
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { PostsService } from './posts.service';
import { LikesService } from '../likes/likes.service';
import { ResponseService } from '../common/services/response.service';

import { FilterDto } from './dto/filter.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '@common/dto/pagination.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtAuthPublicGuard } from '../common/guards/jwt-auth-public.guard';
import { instanceToPlain } from 'class-transformer';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { File, FileInterceptor } from '@nest-lab/fastify-multer';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly likesService: LikesService,
    private readonly responseService: ResponseService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  private readonly logger = new Logger(PostsController.name);

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10_485_760,
      },
    }),
  )
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() currentUser: User,
    @UploadedFile() file: File,
  ) {
    return this.postsService.create(createPostDto, currentUser, file);
  }

  @UseGuards(JwtAuthPublicGuard)
  @Get()
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() filters: FilterDto,
    @Query() pagination: PaginationDto,
    @Query('orderBy') orderBy: string = 'createdAt',
  ) {
    const { data, meta } = await this.postsService.findAll({
      currentUser,
      pagination,
      filters,
      orderBy,
    });

    return this.responseService.successResponse({ data, meta });
  }

  @UseGuards(JwtAuthPublicGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser?: User) {
    const post = await this.postsService.findOne({ id, currentUser });

    return this.responseService.successResponse({
      data: instanceToPlain(post, { groups: ['public'] }),
    });
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

  @UseGuards(JwtAuthGuard)
  @Post(':id/bookmarks')
  bookmarkPost(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.bookmarksService.bookmarkPost(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/bookmarks')
  unbookmarkPost(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.bookmarksService.unbookmarkPost(id, currentUser);
  }
}
