import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';

import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';

import { WsAuthMiddleware } from '../common/middlewares/ws-jwt.middleware';

@Module({
  providers: [NotificationsGateway, NotificationsService, WsAuthMiddleware],
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => MessagesModule),
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
