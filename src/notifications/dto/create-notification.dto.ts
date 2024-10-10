import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  NotificationType,
  NotificationTypes,
  NotificationPriority,
  NotificationPriorities,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(NotificationTypes)
  type: NotificationType;

  @IsString()
  @IsIn(NotificationPriorities)
  priority: NotificationPriority;

  @IsString({ each: true })
  @IsArray()
  @IsNotEmpty()
  receivers: string[];

  @IsString()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsOptional()
  link?: string;

  constructor(partial: Partial<CreateNotificationDto>) {
    Object.assign(this, partial);
  }
}
