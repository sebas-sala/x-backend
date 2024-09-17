import { Comment } from '@/src/comments/entities/comment.entity';
import { Post } from '@/src/posts/entities/post.entity';
import { User } from '@/src/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['post', 'user'], { unique: true })
@Index(['comment', 'user'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, (post) => post.likes)
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.likes)
  comment: Comment;

  @ManyToOne(() => User, (user) => user.likes, { eager: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
