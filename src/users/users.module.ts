import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { Follow } from '../follows/entities/follow.entity';

import { ProfilesModule } from '@/src/profiles/profiles.module';

import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';

@Module({
  imports: [ProfilesModule, TypeOrmModule.forFeature([User, Follow])],
  controllers: [UsersController],
  providers: [UsersService, QueryRunnerFactory],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
