import {
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';

import { UsersService } from './users.service';
import { FollowService } from '../follows/follows.service';
import { ProfilesService } from '@/src/profiles/profiles.service';
import { BlockedUsersService } from '../blocked-users/blocked-users.service';

import { User } from './entities/user.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NonEmptyPayloadGuard } from '../common/guards/non-empty-payload.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponseService } from '../common/services/response.service';

@Controller('users')
export class UsersController {
  constructor(
    private followsService: FollowService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly blockedUsersService: BlockedUsersService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { data, meta } = await this.usersService.findAll({
      paginationDto,
    });

    return this.responseService.successResponse({
      data,
      meta,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneByIdOrFail({ id });
    return instanceToPlain(user, { groups: ['private'] });
  }

  @Get(':username/profile')
  async getProfile(@Param('username') username: string) {
    const user = await this.usersService.findOneByUsernameOrFail({
      username,
      relations: ['profile'],
    });
    return instanceToPlain(user, { groups: ['profile'] });
  }

  @UseGuards(NonEmptyPayloadGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() currentUser: User,
  ): Promise<Profile> {
    return await this.profilesService.update(id, updateProfileDto, currentUser);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return instanceToPlain(user, { groups: ['profile'] });
  }

  @Get(':id/followers')
  async getFollowers(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const { data, meta } = await this.followsService.getFollowers({
      userId: id,
      paginationDto,
    });

    return this.responseService.successResponse({
      data,
      meta,
    });
  }

  @Get(':id/following')
  async getFollowing(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.followsService.getFollowing({
      userId: id,
      paginationDto,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked')
  async getBlockedUsers(
    @CurrentUser() currentUser: User,
    @Query() paginationDto: PaginationDto,
  ) {
    const { data, meta } = await this.blockedUsersService.getBlockedUsers({
      user: currentUser,
      paginationDto,
    });

    return this.responseService.successResponse({
      data,
      meta,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  async blockUser(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.blockedUsersService.blockUser(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/unblock')
  async unblockUser(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.blockedUsersService.unblockUser(id, currentUser);
  }
}
