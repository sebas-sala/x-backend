import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { Comment } from '@/src/comments/entities/comment.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Expose, Type } from 'class-transformer';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Expose()
  @Type(() => User)
  @ManyToOne(() => User, (user) => user.posts, { eager: true, nullable: false })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  isLiked?: boolean;
  likesCount?: number;
}
