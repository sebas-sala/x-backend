import {
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';

@Entity()
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.blockedUsers)
  @JoinColumn()
  blockedBy: User;

  @ManyToOne(() => User, (user) => user.blockedBy)
  @JoinColumn()
  blockedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
