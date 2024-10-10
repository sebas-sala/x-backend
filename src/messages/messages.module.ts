import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';

import { User } from '../users/entities/user.entity';

@Module({
  providers: [MessagesService],
  imports: [TypeOrmModule.forFeature([Message, User])],
  exports: [MessagesService],
})
export class MessagesModule {}
