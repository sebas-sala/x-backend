import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';

import { ChatsModule } from '../chats/chats.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesController } from './messages.controller';
import { ResponseService } from '../common/services/response.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, ResponseService],
  imports: [
    TypeOrmModule.forFeature([Message]),
    forwardRef(() => ChatsModule),
    forwardRef(() => NotificationsModule),
  ],
  exports: [MessagesService],
})
export class MessagesModule {}
