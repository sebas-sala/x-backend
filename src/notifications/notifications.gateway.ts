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
import { forwardRef, Inject, UseFilters, UseGuards } from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { MessagesService } from '../messages/messages.service';

import { WsCurrentUser } from '../common/decorators/ws-current-user.decorator';
import { WsJwtAuthGuard } from '../common/guards/ws-jwt-auth.guard';
import { ResponseService } from '../common/services/response.service';
import { WsAuthMiddleware } from '../common/middlewares/ws-jwt.middleware';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';

import { CreateMessageDto } from '../messages/dto/create-message.dto';

import { NotificationDto } from './interfaces/notification-dto';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private wsAuthMiddleware: WsAuthMiddleware,

    private readonly responseService: ResponseService,

    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    server.use(this.wsAuthMiddleware.use.bind(this.wsAuthMiddleware));
  }

  handleConnection(client: any, ...args: any[]) {
    const user = client.handshake.auth as User;
    this.connectedUsers.set(user.id, client.id);
  }

  handleDisconnect(client: any) {
    const user = client.handshake.auth as User;
    this.connectedUsers.delete(user.id);
  }

  @SubscribeMessage('sendNotification')
  sendNotification(userId: string, notification: NotificationDto) {
    const socketIds = notification.receivers
      .map((receiverId) => this.connectedUsers.get(receiverId))
      .filter(Boolean);

    if (socketIds.length === 0) {
      return;
    }

    for (const socketId of socketIds) {
      if (socketId) {
        this.server.to(socketId).emit('notification', notification);
        this.notificationsService.updateSent(notification);
      }
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
