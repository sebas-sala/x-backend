import { forwardRef, Module } from '@nestjs/common';

import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';

import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';
import { Chat } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    forwardRef(() => UsersModule),
    forwardRef(() => MessagesModule),
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
