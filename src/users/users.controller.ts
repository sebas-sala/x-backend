import {
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ModuleRef } from '@nestjs/core';
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

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private followsService: FollowService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly blockedUsersService: BlockedUsersService,
  ) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    type: [Profile],
    description: 'Return all users',
  })
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return instanceToPlain(users, { groups: ['public'] });
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return user',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneByIdOrFail(id);
    return instanceToPlain(user, { groups: ['private'] });
  }

  @ApiOperation({ summary: 'Get user profile by username' })
  @ApiResponse({
    status: 200,
    type: Profile,
    description: 'Return user profile',
  })
  @Get(':username/profile')
  async getProfile(@Param('username') username: string) {
    const user = await this.usersService.findOneByUsernameOrFail(
      username,
      undefined,
      ['profile'],
    );

    return instanceToPlain(user, { groups: ['profile'] });
  }

  @ApiOperation({ summary: 'Update user profile by id' })
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

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    status: 201,
    type: User,
    description: 'The record has been successfully created.',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return instanceToPlain(user, { groups: ['profile'] });
  }

  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return user followers',
  })
  @Get(':id/followers')
  async getFollowers(@Param('id') id: string) {
    return await this.followsService.getFollowers(id);
  }

  @ApiOperation({ summary: 'Get user following' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return user following',
  })
  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    return await this.followsService.getFollowing(id);
  }

  @ApiOperation({ summary: 'Blocked users' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return followed user',
  })
  @UseGuards(JwtAuthGuard)
  @Get('blocked')
  async getBlockedUsers(@CurrentUser() currentUser: User) {
    return await this.blockedUsersService.getBlockedUsers(currentUser);
  }

  @ApiOperation({ summary: 'Block user' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return blocked user',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  async blockUser(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.blockedUsersService.blockUser(id, currentUser);
  }

  @ApiOperation({ summary: 'Unblock user' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return unblocked user',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/unblock')
  async unblockUser(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return await this.blockedUsersService.unblockUser(id, currentUser);
  }
}
