import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { Notification } from '@/src/notifications/entities/notification.entity';
import { NotificationsService } from '@/src/notifications/notifications.service';

import { NotificationsGateway } from '@/src/notifications/notifications.gateway';

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;
  let notificationsRepository: Repository<Notification>;
  let notificationsGateway: NotificationsGateway;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useClass: Repository,
        },
        {
          provide: NotificationsGateway,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    notificationsService =
      moduleRef.get<NotificationsService>(NotificationsService);
    notificationsRepository = moduleRef.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    notificationsGateway =
      moduleRef.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(notificationsService).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const mockNotification = {
        message: 'message',
        receiver: '1',
        sender: '2',
        title: 'title',
      } as any;

      jest
        .spyOn(notificationsRepository, 'create')
        .mockReturnValue(mockNotification as any);

      jest
        .spyOn(notificationsRepository, 'save')
        .mockResolvedValue(mockNotification as any);

      const notification = await notificationsService.create(mockNotification);

      expect(notification).toEqual(mockNotification);
    });
  });

  describe('Followers notifications', () => {
    it('should handle follow notifications when followers are more than 5', async () => {
      const mockGroupedNotifications = [{ receiverId: '1', count: 6 }];

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockGroupedNotifications),
      };

      jest
        .spyOn(notificationsRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      jest
        .spyOn(notificationsService as any, 'setNotificationToSend')
        .mockReturnValue({
          message: 'You have 6 new followers',
          receiver: { id: '1' },
          title: 'New followers',
        } as any);

      await notificationsService.handleFollowers();

      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          message: 'You have 6 new followers',
          title: 'New followers',
        }),
      );
    });

    it('should handle follow notifications when followers are less than 5', async () => {
      const mockGroupedNotifications = [{ receiverId: '1', count: 3 }];

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockGroupedNotifications),
      };

      jest
        .spyOn(notificationsRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const mockNotifications = [
        { message: 'message1', receiver: { id: '1' }, title: 'title1' },
        { message: 'message2', receiver: { id: '1' }, title: 'title2' },
        { message: 'message3', receiver: { id: '1' }, title: 'title3' },
      ];

      jest
        .spyOn(notificationsRepository, 'find')
        .mockResolvedValue(mockNotifications as any);

      await notificationsService.handleFollowers();

      expect(notificationsGateway.sendNotification).toHaveBeenCalledTimes(3);
      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          message: 'message1',
          title: 'title1',
        }),
      );
      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          message: 'message2',
          title: 'title2',
        }),
      );
    });
  });

  describe('Likes notifications', () => {
    it('should handle like notifications', async () => {
      const mockGroupedNotifications = [{ receiverId: '1', count: 6 }];

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockGroupedNotifications),
      };

      jest
        .spyOn(notificationsRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      jest
        .spyOn(notificationsService as any, 'setNotificationToSend')
        .mockReturnValue({
          message: 'You have 6 new likes',
          receiver: { id: '1' },
          title: 'New likes',
        } as any);

      await notificationsService.handleLikes();

      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          message: 'You have 6 new likes',
          title: 'New likes',
        }),
      );
    });
  });
});
