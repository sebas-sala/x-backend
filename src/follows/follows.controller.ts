import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FollowService } from './follows.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { DeleteFollowDto } from './dto/delete-follow.dto';

@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  async create(@Body() createFollowDto: CreateFollowDto) {
    return await this.followService.create(createFollowDto);
  }

  @Delete()
  async remove(@Body() deleteFollowDto: DeleteFollowDto) {
    return await this.followService.remove(deleteFollowDto);
  }

  @Get('users/:userId/followers')
  getFollowers(@Param('userId') userId: string) {
    return this.followService.findFollowers(userId);
  }

  @Get('users/:userId/following')
  getFollowing(@Param('userId') userId: string) {
    return this.followService.findFollowing(userId);
  }
}