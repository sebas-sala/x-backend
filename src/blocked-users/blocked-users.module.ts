import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';

import { BlockedUsersService } from './blocked-users.service';

import { User } from '../users/entities/user.entity';
import { BlockedUser } from './entities/blocked-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockedUser, User]),
    forwardRef(() => UsersModule),
  ],
  providers: [BlockedUsersService],
  exports: [BlockedUsersService],
})
export class BlockedUsersModule {}
