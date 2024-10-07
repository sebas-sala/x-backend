import { forwardRef, Module } from '@nestjs/common';

import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';

import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';
import { Chat } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => MessagesModule),
    TypeOrmModule.forFeature([Chat]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
