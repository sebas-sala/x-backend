import { User } from '@/src/users/entities/user.entity';
import {
  Index,
  Entity,
  Column,
  ManyToOne,
  JoinTable,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  EntityType,
  NotificationType,
  NotificationPriority,
} from '../interfaces/notification-dto';

export const NotificationTypes = [
  'like',
  'comment',
  'follow',
  'message',
  'mention',
] as const;
export const NotificationPriorities = ['low', 'medium', 'high'] as const;
export const EntityTypes = ['post', 'message', 'comment', 'like'] as const;

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  message: string;

  @Column()
  title: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true, type: 'text' })
  readAt: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true, type: 'text' })
  deletedAt: Date | null;

  @Column({ nullable: true })
  entityId?: string;

  @Column({
    type: 'text',
    enum: EntityTypes,
    nullable: true,
  })
  entityType?: EntityType;

  @Index()
  @Column({
    type: 'text',
    enum: NotificationTypes,
  })
  type: NotificationType;

  @Index()
  @Column({
    type: 'text',
    enum: NotificationPriorities,
    default: 'medium',
  })
  priority: NotificationPriority;

  @Column({ nullable: true })
  link?: string;

  @ManyToMany(() => User, (user) => user.notifications, { cascade: true })
  @JoinTable()
  receivers: User[];

  @ManyToOne(() => User, { nullable: true })
  sender?: User | null;
}
