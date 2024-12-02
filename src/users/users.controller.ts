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
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthPublicGuard } from '../common/guards/jwt-auth-public.guard';
import { FiltersDto } from './dto/filters.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly followService: FollowService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly blockedUsersService: BlockedUsersService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(JwtAuthPublicGuard)
  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filtersDto: FiltersDto,
    @CurrentUser() currentUser: User,
  ) {
    const { data, meta } = await this.usersService.findAll({
      paginationDto,
      currentUser,
      filtersDto,
    });

    return this.responseService.successResponse({
      data: instanceToPlain(data, { groups: ['profile'] }),
      meta,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneByIdOrFail({ id });

    return this.responseService.successResponse({
      data: instanceToPlain(user, { groups: ['private'] }),
    });
  }

  @UseGuards(ThrottlerGuard)
  @UseGuards(JwtAuthPublicGuard)
  @Get(':username/profile')
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.findOneByUsernameOrFail({
      username,
      relations: ['profile'],
      currentUser,
    });

    return this.responseService.successResponse({
      data: instanceToPlain(user, { groups: ['profile'] }),
    });
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
    const response = await this.usersService.create(createUserDto);

    const { access_token, ...user } = response;

    return this.responseService.successResponse({
      data: {
        user: instanceToPlain(user, { groups: ['profile'] }),
        access_token: access_token,
      },
    });
  }

  @UseGuards(JwtAuthPublicGuard)
  @Get(':username/followers')
  async getFollowers(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    const { data, meta } = await this.followService.getFollowers({
      username,
      paginationDto,
      currentUser,
    });

    return this.responseService.successResponse({
      data: instanceToPlain(data, { groups: ['profile'] }),
      meta,
    });
  }

  @UseGuards(JwtAuthPublicGuard)
  @Get(':username/following')
  async getFollowing(
    @Param('username') id: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    const { data, meta } = await this.followService.getFollowing({
      username: id,
      paginationDto,
      currentUser,
    });

    return this.responseService.successResponse({
      data: instanceToPlain(data, { groups: ['profile'] }),
      meta,
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

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.followService.create(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/unfollow')
  async unfollow(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.followService.remove(id, currentUser);
  }
}
