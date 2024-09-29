import {
  MessageBody,
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { MessagesService } from './messages.service';

import { CreateMessageDto } from './dto/create-message.dto';

import { WsJwtAuthGuard } from '../common/guards/ws-jwt-auth.guard';
import { WsCurrentUser } from '../common/decorators/ws-current-user.decorator';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'messages',
  transports: ['websocket'],
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @WsCurrentUser() user: User,
  ): Promise<any> {
    try {
      const message = await this.messagesService.create(createMessageDto, user);
      return message;

      this.server.emit('newMessage', message);
    } catch (error) {
      return error;
    }
  }

  // @SubscribeMessage('findAllMessages')
  // findAll() {
  //   return this.messagesService.findAll();
  // }

  // @SubscribeMessage('findOneMessage')
  // findOne(@MessageBody() id: number) {
  //   // return this.messagesService.findOne(id);
  // }

  // @SubscribeMessage('updateMessage')
  // update(@MessageBody() updateMessageDto: UpdateMessageDto) {
  //   return this.messagesService.update(updateMessageDto.id, updateMessageDto);
  // }

  // @SubscribeMessage('removeMessage')
  // remove(@MessageBody() id: number) {
  //   // return this.messagesService.remove(id);
  // }
}
