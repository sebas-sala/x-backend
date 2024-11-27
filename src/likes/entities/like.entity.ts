import {
  Index,
  Entity,
  ManyToOne,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from '@/src/posts/entities/post.entity';
import { User } from '@/src/users/entities/user.entity';

@Entity()
@Index(['post', 'user'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.likes)
  post: Post;

  @ManyToOne(() => User, (user) => user.likes, { eager: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
