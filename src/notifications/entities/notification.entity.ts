import { User } from '@/src/users/entities/user.entity';
import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const NotificationTypes = [
  'like',
  'comment',
  'follow',
  'message',
  'mention',
] as const;
export type NotificationType = (typeof NotificationTypes)[number];

export const NotificationPriorities = ['low', 'medium', 'high'] as const;
export type NotificationPriority = (typeof NotificationPriorities)[number];

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

  @Column()
  isRead: boolean;

  @Column({ nullable: true, type: 'text' })
  readAt: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true, type: 'text' })
  deletedAt: Date | null;

  @Column({
    type: 'text',
    enum: NotificationTypes,
  })
  type: NotificationType;

  @Column({
    type: 'text',
    enum: NotificationPriorities,
    default: 'medium',
  })
  priority: NotificationPriority;

  @Column()
  link: string;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
