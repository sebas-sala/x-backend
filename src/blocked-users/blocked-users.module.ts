import { Module } from '@nestjs/common';
import { BlockedUsersService } from './blocked-users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser } from './entities/blocked-user.entity';
import { User } from '../users/entities/user.entity';
import { QueryRunnerFactory } from '../common/factories/query-runner.factory';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedUser, User])],
  providers: [BlockedUsersService, QueryRunnerFactory],
  exports: [BlockedUsersService],
})
export class BlockedUsersModule {}
