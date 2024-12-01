import { Cron } from '@nestjs/schedule';
import { In, Repository } from 'typeorm';
import {
  ConsoleLogger,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Notification,
  NotificationTypes,
} from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

import { UsersService } from '../users/users.service';

import {
  NotificationDto,
  NotificationType,
} from './interfaces/notification-dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationService } from '../common/services/pagination.service';

@Injectable()
export class NotificationsService {
  private readonly MAX_BATCH_SIZE = 200;

  private readonly priorities = {
    like: 'high',
    follow: 'low',
    message: 'high',
    comment: 'medium',
    mention: 'low',
  } as const;

  private readonly messageTitle = {
    like: 'New likes',
    follow: 'New followers',
    message: 'New messages',
    comment: 'New comments',
    mention: 'New mentions',
  };

  private readonly messagePrefix = {
    like: 'You have new',
    follow: 'You have new',
    message: 'You have new',
    comment: 'You have new',
    mention: 'You have new',
  };

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private readonly usersService: UsersService,
    private readonly paginationService: PaginationService,

    @Inject(forwardRef(() => NotificationsGateway))
    private notificationGateway: NotificationsGateway,
  ) {}

  private readonly logger = new Logger(NotificationsService.name);

  async findAll(userId: string) {
    const notifications = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.receivers', 'receivers')
      .leftJoinAndSelect('notification.sender', 'sender')
      .where('receivers.id = :userId', { userId });

    return this.paginationService.paginate({
      query: notifications,
    });
  }

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notificationDto = this.setNotificationDto(createNotificationDto);
    const users = await this.usersService.findByIds(
      createNotificationDto.receivers,
    );

    const notification = this.notificationRepository.create({
      ...notificationDto,
      sender: { id: createNotificationDto.sender },
      receivers: users,
    });
    return await this.notificationRepository.save(notification);
  }

  async updateSent(notification: NotificationDto) {
    if (notification.sender === 'system') {
      for (const receiver of notification.receivers) {
        const notificationsToUpdate = await this.notificationRepository.find({
          where: {
            type: notification.type,
            receivers: { id: receiver },
          },
        });

        const notificationIds = notificationsToUpdate.map((notif) => notif.id);

        await this.notificationRepository.update(
          { id: In(notificationIds) },
          { sent: true },
        );
      }
    } else {
      await this.notificationRepository.update(
        { id: notification.id },
        { sent: true },
      );
    }
  }

  @Cron('*/45 * * * * *')
  async handleLowPriorityNotifications() {
    await this.handleNotifications('low');
  }

  @Cron('*/30 * * * * *')
  async handleMediumPriorityNotifications() {
    await this.handleNotifications('medium');
  }

  @Cron('*/15 * * * * *')
  async handleHighPriorityNotifications() {
    await this.handleNotifications('high');
  }

  private async handleNotifications(priority: string) {
    const notificationTypes = this.getNotificationTypesByPriority(priority);

    try {
      for (const type of notificationTypes) {
        await this.processNotifications(type, priority);
      }
    } catch (error) {
      this.logger.error(`Error processing notifications: ${error.message}`);
      throw new Error(error.message);
    }
  }

  private getNotificationTypesByPriority(priority: string) {
    return NotificationTypes.filter(
      (type) => this.priorities[type] === priority,
    );
  }

  private async processNotifications(type: NotificationType, priority: string) {
    const groupedNotifications = await this.getGroupedNotifications(
      type,
      priority,
    );

    if (groupedNotifications.length === 0) {
      return;
    }

    for (const { receiverId, count, latestCreatedAt } of groupedNotifications) {
      if (count > 5) {
        this.sendGroupedNotifications(receiverId, count, type, latestCreatedAt);
      } else {
        await this.sendIndividualNotifications(receiverId, count, type);
      }
    }
  }

  private sendGroupedNotifications(
    receiverId: string,
    count: number,
    type: NotificationType,
    latestCreatedAt: Date,
  ) {
    const notification = this.setNotificationDto({
      type: type,
      sender: 'system',
      title: this.messageTitle.like,
      receivers: [receiverId],
      message: `${this.messagePrefix.like} ${count} ${type}s`,
      createdAt: latestCreatedAt,
    });

    this.notificationGateway.sendNotification(receiverId, notification);
  }

  private async sendIndividualNotifications(
    receiverId: string,
    count: number,
    type: NotificationType,
  ) {
    const notifications = await this.notificationRepository.find({
      where: {
        type: type,
        receivers: { id: receiverId },
        isRead: false,
      },
      take: count,
    });

    for (const notification of notifications) {
      const _notification = this.setNotificationDto({
        id: notification.id,
        receivers: [receiverId],
        type: notification.type,
        title: notification.title,
        message: notification.message,
        sender: notification.sender?.username || 'system',
        entityId: notification.entityId,
        entityType: notification.entityType,
        createdAt: notification.createdAt,
      });

      this.notificationGateway.sendNotification(receiverId, _notification);
    }
  }

  private async getGroupedNotifications(type: string, priority: string) {
    return await this.notificationRepository
      .createQueryBuilder('notification')
      .select('receiver.id', 'receiverId')
      .addSelect('COUNT(notification.id)', 'count')
      .addSelect('MAX(notification.createdAt)', 'latestCreatedAt')
      .innerJoin('notification.receivers', 'receiver')
      .where('notification.isRead = false')
      .andWhere('notification.type = :type', { type })
      .andWhere('notification.priority = :priority', { priority })
      .andWhere('notification.sent = false')
      .groupBy('receiver.id')
      .limit(this.MAX_BATCH_SIZE)
      .getRawMany();
  }

  async findNotificationByEntityAndUser(
    type: NotificationType,
    entityId: string,
    userId: string,
  ): Promise<Notification | null> {
    return await this.notificationRepository.findOneBy({
      entityId,
      type,
      receivers: { id: userId },
    });
  }

  setNotificationDto({
    id,
    type,
    title,
    sender,
    message,
    priority,
    receivers,
    link,
    entityId,
    entityType,
    createdAt,
  }: CreateNotificationDto): NotificationDto {
    return {
      id,
      type,
      title,
      sender,
      message,
      receivers,
      priority: priority || this.priorities[type],
      link,
      entityId,
      entityType,
      createdAt,
    };
  }
}
