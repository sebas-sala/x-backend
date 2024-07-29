import { instanceToPlain } from 'class-transformer';
import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesService } from '@/src/profiles/profiles.service';
import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return instanceToPlain(users, { groups: ['public'] });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    return instanceToPlain(user, { groups: ['private'] });
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    return instanceToPlain(user, { groups: ['profile'] });
  }

  @Patch(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() profile: UpdateProfileDto,
  ): Promise<Profile> {
    return await this.profilesService.update(id, profile);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return instanceToPlain(user, { groups: ['profile'] });
  }

  // @Roles('user')
  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
