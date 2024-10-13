import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';

import { Chat } from './entities/chat.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';

import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';
import { BlockService } from '../common/services/block.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    forwardRef(() => UsersModule),
    forwardRef(() => MessagesModule),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, BlockService],
  exports: [ChatsService],
})
export class ChatsModule {}
