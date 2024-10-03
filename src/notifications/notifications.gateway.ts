import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { forwardRef, Inject, UseInterceptors } from '@nestjs/common';

import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { User } from '../users/entities/user.entity';
import { WsJwtInterceptor } from '../common/interceptors/ws-jwt.interceptor';
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
    console.log('Sending notification to user', userId);
    console.log(this.connectedUsers);
    if (this.connectedUsers.has(userId)) {
      console.log('Sending notification to user', userId);
      this.server.to(userId).emit('sendNotification', notification);
    }
  }

  @SubscribeMessage('findAllNotifications')
  findAll() {
    return this.notificationsService.findAll();
  }

  @SubscribeMessage('findOneNotification')
  findOne(@MessageBody() id: number) {
    return this.notificationsService.findOne(id);
  }

  @SubscribeMessage('updateNotification')
  update(@MessageBody() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(
      updateNotificationDto.id,
      updateNotificationDto,
    );
  }

  @SubscribeMessage('removeNotification')
  remove(@MessageBody() id: number) {
    return this.notificationsService.remove(id);
  }
}
