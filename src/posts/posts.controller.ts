import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthPublicGuard } from '../common/guards/jwt-auth-public.guard';
import { CommentsService } from '../comments/comments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @UseGuards(JwtAuthPublicGuard)
  @Get()
  findAll(@CurrentUser() currentUser: string) {
    return this.postsService.findAll(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
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
    @CurrentUser() currentUser: string,
  ) {
    return this.commentsService.createPostComment(
      id,
      createCommentDto,
      currentUser,
    );
  }
}
