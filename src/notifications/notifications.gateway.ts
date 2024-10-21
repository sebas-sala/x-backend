import {
  MessageBody,
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io-client';
import { UseFilters, UseGuards } from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { MessagesService } from '../messages/messages.service';

import { WsCurrentUser } from '../common/decorators/ws-current-user.decorator';
import { WsJwtAuthGuard } from '../common/guards/ws-jwt-auth.guard';
import { ResponseService } from '../common/services/response.service';
import { WsAuthMiddleware } from '../common/middlewares/ws-jwt.middleware';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';

import { CreateMessageDto } from '../messages/dto/create-message.dto';

import { NotificationDto } from './interfaces/notification-dto';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Set<string> = new Set();

  constructor(
    private readonly messagesService: MessagesService,
    private wsAuthMiddleware: WsAuthMiddleware,

    private readonly responseService: ResponseService,
  ) {}

  afterInit(server: Server) {
    server.use(this.wsAuthMiddleware.use.bind(this.wsAuthMiddleware));
  }

  handleConnection(client: any, ...args: any[]) {
    const user = client.handshake.auth as User;
    this.connectedUsers.add(user.id);
  }

  handleDisconnect(client: any) {
    const user = client.handshake.auth as User;
    this.connectedUsers.delete(user.id);
  }

  @SubscribeMessage('sendNotification')
  sendNotification(userId: string, notification: NotificationDto) {
    if (this.connectedUsers.has(userId)) {
      this.server.to(userId).emit('sendNotification', notification);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @UseFilters(new WsExceptionFilter())
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @WsCurrentUser() sender: User,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create(createMessageDto, sender);
    const response = this.responseService.successResponse(
      { data: message },
      201,
    );

    client.emit('message', response);
    return response;
  }
}
