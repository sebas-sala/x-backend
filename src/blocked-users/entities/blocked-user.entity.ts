import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

@Entity()
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.blockedUsers)
  @JoinColumn({ name: 'blockingUserId' })
  blockingUser: User;

  @ManyToOne(() => User, (user) => user.blockedBy)
  @JoinColumn({ name: 'blockedUserId' })
  blockedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
