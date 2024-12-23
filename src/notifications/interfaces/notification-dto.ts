import {
  NotificationTypes,
  NotificationPriorities,
  EntityTypes,
} from '../entities/notification.entity';

export type EntityType = (typeof EntityTypes)[number];
export type NotificationType = (typeof NotificationTypes)[number];
export type NotificationPriority = (typeof NotificationPriorities)[number];

export interface NotificationDto {
  id?: string;
  createdAt?: Date;
  title: string;
  sender: string;
  message: string;
  receivers: string[];
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  entityId?: string;
  entityType?: EntityType;
}
