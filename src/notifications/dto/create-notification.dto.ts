import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  NotificationTypes,
  NotificationPriorities,
  EntityTypes,
} from '../entities/notification.entity';
import {
  EntityType,
  NotificationPriority,
  NotificationType,
} from '../interfaces/notification-dto';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  sender: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  receivers: string[];

  @IsString()
  @IsNotEmpty()
  @IsIn(NotificationTypes)
  type: NotificationType;

  @IsString()
  @IsOptional()
  @IsIn(NotificationPriorities)
  priority?: NotificationPriority;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  @IsIn(EntityTypes)
  entityType?: EntityType;

  constructor(partial: Partial<CreateNotificationDto>) {
    Object.assign(this, partial);
  }
}
