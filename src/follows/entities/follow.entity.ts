import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @ManyToOne(() => User, (user) => user.following, { nullable: false })
  // @JoinColumn({ name: 'followingId' })
  // following: User;

  // @ManyToOne(() => User, (user) => user.followers, { nullable: false })
  // @JoinColumn({ name: 'followerId' })
  // follower: User;

  @CreateDateColumn()
  createdAt: Date;
}
