import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';

import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';

import { WsAuthMiddleware } from '../common/middlewares/ws-jwt.middleware';
import { ResponseService } from '../common/services/response.service';
import { PaginationService } from '../common/services/pagination.service';

@Module({
  providers: [
    NotificationsGateway,
    NotificationsService,
    WsAuthMiddleware,
    ResponseService,
    PaginationService,
  ],
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => MessagesModule),
    forwardRef(() => UsersModule),
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
