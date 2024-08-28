import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Follow } from './entities/follow.entity';
import { FollowService } from './follows.service';
import { FollowController } from './follows.controller';

import { UsersModule } from '@/src/users/users.module';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Follow])],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
