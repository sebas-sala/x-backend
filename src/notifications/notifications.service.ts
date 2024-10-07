import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationGateway: NotificationsGateway,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { sender, receiver } = createNotificationDto;

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      sender: { id: sender },
      receiver: { id: receiver },
    });
    return await this.notificationRepository.save(notification);
  }

  @Cron('45 * * * * *')
  async handleFollowers() {
    const batch = 100;

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.receiverId', 'receiverId')
      .addSelect('COUNT(notification.id)', 'count')
      .where('notification.read = false')
      .andWhere('notification.type = :type', { type: 'follow' })
      .groupBy('notification.receiverId')
      .limit(batch)
      .getRawMany();

    const groupedNotifications = await query;

    for (const { receiverId, count } of groupedNotifications) {
      if (count > 5) {
        const notification = this.setNotificationToSend({
          message: `You have ${count} new followers`,
          receiver: receiverId,
          title: 'New followers',
        });
        this.notificationGateway.sendNotification(receiverId, notification);
      } else {
        const notifications = await this.notificationRepository.find({
          where: {
            receiver: { id: receiverId },
            isRead: false,
            type: 'follow',
          },
          take: count,
        });
        for (const notification of notifications) {
          this.notificationGateway.sendNotification(receiverId, notification);
        }
      }
    }
  }

  @Cron('45 * * * * *')
  async handleLikes() {
    const batch = 100;

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.receiverId', 'receiverId')
      .addSelect('COUNT(notification.id)', 'count')
      .where('notification.read = false')
      .andWhere('notification.type = :type', { type: 'like' })
      .groupBy('notification.receiverId')
      .limit(batch)
      .getRawMany();

    const groupedNotifications = await query;

    for (const { receiverId, count } of groupedNotifications) {
      if (count > 5) {
        const notification = this.setNotificationToSend({
          message: `You have ${count} new likes`,
          receiver: receiverId,
          title: 'New likes',
        });
        this.notificationGateway.sendNotification(receiverId, notification);
      } else {
        const notifications = await this.notificationRepository.find({
          where: {
            receiver: { id: receiverId },
            isRead: false,
            type: 'like',
          },
          take: count,
        });
        for (const notification of notifications) {
          this.notificationGateway.sendNotification(receiverId, notification);
        }
      }
    }
  }

  private setNotificationToSend({
    message,
    receiver,
    title,
    sender = 'system',
  }: NotificationDto) {
    return this.notificationRepository.create({
      message,
      receiver: { id: receiver },
      title,
      sender: { id: sender },
    });
  }
}
