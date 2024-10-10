import {
  Column,
  Entity,
  JoinTable,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Message } from '@/src/messages/entities/message.entity';
import { User } from '@/src/users/entities/user.entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable()
  users: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  @Column({ default: false })
  isChatGroup: boolean;

  @Column({ nullable: true })
  name?: string;

  @CreateDateColumn()
  createdAt: Date;
}
