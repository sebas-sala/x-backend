import { WsAuthMiddleware } from '@/src/common/middlewares/ws-jwt.middleware';
import { Notification } from '@/src/notifications/entities/notification.entity';
import { NotificationsGateway } from '@/src/notifications/notifications.gateway';
import { NotificationsService } from '@/src/notifications/notifications.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: NotificationsService,
          useValue: {},
        },
        {
          provide: WsAuthMiddleware,
          useValue: {
            use: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should add user to connected users', () => {
      const client = {
        handshake: {
          auth: { id: '1' },
        },
      };

      gateway.handleConnection(client as any);

      expect((gateway as any).connectedUsers.has('1')).toBeTruthy();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user from connected users', () => {
      const client = {
        handshake: {
          auth: { id: '1' },
        },
      };

      (gateway as any).connectedUsers.add('1');
      gateway.handleDisconnect(client as any);

      expect((gateway as any).connectedUsers.has('1')).toBeFalsy();
    });
  });

  describe('sendNotification', () => {
    it('should send notification to connected user', () => {
      const userId = '1';
      const notification = {
        id: '1',
        message: 'Test notification',
      } as Notification;

      (gateway as any).connectedUsers.add(userId);
      (gateway as any).server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      gateway.sendNotification(userId, notification);

      expect((gateway as any).server.to).toHaveBeenCalledWith(userId);
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'sendNotification',
        notification,
      );
    });

    it('should not send notification to disconnected user', () => {
      const userId = '1';
      const notification = {
        id: '1',
        message: 'Test notification',
      } as Notification;

      (gateway as any).server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      gateway.sendNotification(userId, notification);

      expect((gateway as any).server.to).not.toHaveBeenCalled();
      expect((gateway as any).server.emit).not.toHaveBeenCalled();
    });
  });
});
