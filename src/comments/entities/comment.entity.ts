import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Post } from '@/src/posts/entities/post.entity';
import { User } from '@/src/users/entities/user.entity';
import { Like } from '@/src/likes/entities/like.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  content: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
  })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent, {
    nullable: true,
  })
  replies: Comment[];

  @ManyToOne(() => Post, (post) => post.comments, { nullable: true })
  post?: Post;

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @ManyToOne(() => User, (user) => user.comments, { eager: true })
  user: User;
}
