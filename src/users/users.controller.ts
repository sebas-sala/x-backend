import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { instanceToPlain } from 'class-transformer';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Delete,
  Req,
} from '@nestjs/common';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesService } from '@/src/profiles/profiles.service';
import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';

import { NonEmptyPayloadGuard } from '../common/guards/non-empty-payload.guard';
import { BlockedUsersService } from '../blocked-users/blocked-users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
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
    const user = await this.usersService.findOneById(id);
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
    const user = await this.usersService.findByUsername(username);

    return instanceToPlain(user, { groups: ['profile'] });
  }

  @ApiOperation({ summary: 'Update user profile by id' })
  @UseGuards(NonEmptyPayloadGuard)
  @Patch(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() profile: UpdateProfileDto,
  ): Promise<Profile> {
    return await this.profilesService.update(id, profile);
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
    return await this.usersService.getFollowers(id);
  }

  @ApiOperation({ summary: 'Get user following' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Return user following',
  })
  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    return await this.usersService.getFollowing(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked')
  async getBlockedUsers(@CurrentUser() currentUser: string) {
    return await this.blockedUsersService.getBlockedUsers(currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  async blockUser(@Param('id') id: string, @CurrentUser() currentUser: string) {
    return await this.blockedUsersService.blockUser(currentUser, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/unblock')
  async unblockUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: string,
  ) {
    return await this.blockedUsersService.unblockUser(currentUser, id);
  }

  // @Roles('user')
  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
