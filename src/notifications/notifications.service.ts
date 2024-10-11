import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

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

@Injectable()
export class NotificationsService {
  private readonly MAX_BATCH_SIZE = 200;

  private readonly priorities = {
    like: 'low',
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

    private notificationGateway: NotificationsGateway,
    private readonly usersService: UsersService,
  ) {}

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

  @Cron('45 * * * * *')
  async handleNotifications() {
    for (const type of NotificationTypes) {
      try {
        await this.processNotifications(type);
      } catch (error) {
        console.error(
          `Error processing ${type} notifications: ${error.message}`,
        );
      }
    }
  }

  private async processNotifications(type: NotificationType) {
    const groupedNotifications = await this.getGroupedNotifications(type);

    for (const { receiverId, count } of groupedNotifications) {
      if (count > 5) {
        this.sendGroupedNotifications(receiverId, count, type);
      } else {
        await this.sendIndividualNotifications(receiverId, count, type);
      }
    }
  }

  private sendGroupedNotifications(
    receiverId: string,
    count: number,
    type: NotificationType,
  ) {
    const notification = this.setNotificationDto({
      type: type,
      sender: 'system',
      title: this.messageTitle.like,
      receivers: [receiverId],
      message: `${this.messagePrefix.like} ${count} ${type}s`,
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
        receivers: [receiverId],
        type: notification.type,
        title: notification.title,
        message: notification.message,
        sender: notification.sender?.username || 'system',
      });

      this.notificationGateway.sendNotification(receiverId, _notification);
    }
  }

  private async getGroupedNotifications(type: string) {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.receiverId', 'receiverId')
      .addSelect('COUNT(notification.id)', 'count')
      .where('notification.read = false')
      .andWhere('notification.type = :type', { type })
      .groupBy('notification.receiverId')
      .limit(this.MAX_BATCH_SIZE)
      .getRawMany();
  }

  setNotificationDto({
    type,
    title,
    sender,
    message,
    priority,
    receivers,
  }: CreateNotificationDto): NotificationDto {
    return {
      type,
      title,
      sender,
      message,
      receivers,
      priority: priority || this.priorities[type],
    };
  }
}
