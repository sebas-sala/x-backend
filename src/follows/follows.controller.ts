import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FollowService } from './follows.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { DeleteFollowDto } from './dto/delete-follow.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('follows')
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
}
