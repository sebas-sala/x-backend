import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Post } from '@/src/posts/entities/post.entity';
import { User } from '@/src/users/entities/user.entity';

@Entity()
@Unique(['post', 'user'])
export class View {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.views, { eager: true, nullable: false })
  post: Post;

  @ManyToOne(() => User, (user) => user.views, { eager: true, nullable: false })
  user: User;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
