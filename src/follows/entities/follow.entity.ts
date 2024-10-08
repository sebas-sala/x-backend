import {
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

@Entity()
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.following)
  @JoinColumn({ name: 'followingId' })
  following: User;

  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @CreateDateColumn()
  createdAt: Date;
}
