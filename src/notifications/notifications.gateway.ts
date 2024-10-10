import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { forwardRef, Inject } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

import { NotificationsService } from './notifications.service';

import { WsAuthMiddleware } from '../common/middlewares/ws-jwt.middleware';

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
}
