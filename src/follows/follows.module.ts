import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { Follow } from './entities/follow.entity';
import { FollowService } from './follows.service';
import { FollowController } from './follows.controller';
import { UsersModule } from '@/src/users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Follow, User])],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
