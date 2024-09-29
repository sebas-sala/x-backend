import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';

@Module({
  providers: [NotificationsGateway, NotificationsService],
  imports: [TypeOrmModule.forFeature([Notification])],
  exports: [NotificationsService],
})
export class NotificationsModule {}
