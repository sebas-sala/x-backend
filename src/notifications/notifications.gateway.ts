import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from './notifications.service';

import { WsJwtAuthGuard } from '../common/guards/ws-jwt-auth.guard';
import { WsAuthMiddleware } from '../common/middlewares/ws-jwt.middleware';
import { WsCurrentUser } from '../common/decorators/ws-current-user.decorator';

import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { Socket } from 'socket.io-client';

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
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly messagesService: MessagesService,
    private wsAuthMiddleware: WsAuthMiddleware,
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
  sendNotification(userId: string, notification: Notification) {
    if (this.connectedUsers.has(userId)) {
      this.server.to(userId).emit('sendNotification', notification);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @WsCurrentUser() sender: User,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messagesService.create(
        createMessageDto,
        sender,
      );

      return message;
    } catch (error) {
      this.emitError(client, error);
      return error;
    }
  }

  private emitError(client: Socket, error: Error) {
    client.emit('error', {
      error: error.message,
      success: false,
      timestamp: new Date().toISOString(),
    });
  }
}
