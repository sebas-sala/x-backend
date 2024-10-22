import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Follow } from './entities/follow.entity';
import { FollowService } from './follows.service';
import { FollowController } from './follows.controller';

import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { PaginationService } from '../common/services/pagination.service';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([Follow, User]),
  ],
  controllers: [FollowController],
  providers: [FollowService, PaginationService],
  exports: [FollowService],
})
export class FollowsModule {}
