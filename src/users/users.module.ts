import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { ProfilesModule } from '@/src/profiles/profiles.module';
import { FollowsModule } from '../follows/follows.module';
import { BlockedUsersModule } from '../blocked-users/blocked-users.module';

import { ResponseService } from '../common/services/response.service';
import { PaginationService } from '../common/services/pagination.service';
import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';

@Module({
  imports: [
    FollowsModule,
    ProfilesModule,
    BlockedUsersModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    ResponseService,
    PaginationService,
    QueryRunnerFactory,
  ],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
