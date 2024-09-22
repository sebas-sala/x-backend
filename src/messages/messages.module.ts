import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';

import { User } from '../users/entities/user.entity';

@Module({
  providers: [MessagesGateway, MessagesService],
  imports: [TypeOrmModule.forFeature([Message, User])],
})
export class MessagesModule {}
