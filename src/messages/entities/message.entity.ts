import {
  Column,
  Entity,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { Chat } from '@/src/chats/entities/chat.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.messages, {
    eager: true,
    nullable: true,
  })
  user: User;

  @ManyToOne(() => Chat, (chat) => chat.messages, {
    eager: true,
    nullable: true,
  })
  chat: Chat;
}
