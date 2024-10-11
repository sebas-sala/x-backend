import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';

import { ChatsModule } from '../chats/chats.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  providers: [MessagesService],
  imports: [
    TypeOrmModule.forFeature([Message]),
    forwardRef(() => ChatsModule),
    forwardRef(() => NotificationsModule),
  ],
  exports: [MessagesService],
})
export class MessagesModule {}
