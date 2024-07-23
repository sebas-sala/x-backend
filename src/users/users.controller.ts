import { instanceToPlain } from 'class-transformer';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { Role, Roles } from 'src/common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return instanceToPlain(users, { groups: ['admin'] });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return await this.usersService.findById(id);
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
