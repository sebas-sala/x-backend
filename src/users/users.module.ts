import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { ProfilesModule } from 'src/profiles/profiles.module';
import { QueryRunnerFactory } from 'src/dababase/query-runner.factory';

@Module({
  imports: [ProfilesModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, QueryRunnerFactory],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
