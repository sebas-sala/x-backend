import { Controller, Post, Body, Delete, UseGuards } from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { FollowService } from './follows.service';

import { CreateFollowDto } from './dto/create-follow.dto';
import { DeleteFollowDto } from './dto/delete-follow.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createFollowDto: CreateFollowDto,
    @CurrentUser() currentUser: User,
  ) {
    return await this.followService.create(createFollowDto, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async remove(
    @Body() deleteFollowDto: DeleteFollowDto,
    @CurrentUser() currentUser: User,
  ) {
    return await this.followService.remove(deleteFollowDto, currentUser);
  }
}
