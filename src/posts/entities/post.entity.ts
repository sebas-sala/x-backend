import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose, Type } from 'class-transformer';

import { User } from '@/src/users/entities/user.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { View } from '@/src/views/entities/view.entity';
import { Bookmark } from '@/src/bookmarks/entities/bookmark.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({ default: false })
  isReply: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Expose()
  @Type(() => User)
  @ManyToOne(() => User, (user) => user.posts, { eager: true, nullable: false })
  user: User;

  @Column({ nullable: true })
  image_url?: string;

  @ManyToOne(() => Post, (post) => post.replies, {
    nullable: true,
  })
  parent: Post;

  @OneToMany(() => Post, (post) => post.parent, {
    nullable: true,
  })
  replies: Post[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @OneToMany(() => View, (view) => view.post)
  views: View[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.post)
  bookmarks: Bookmark[];

  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  isViewed?: boolean;
  viewsCount?: number;
}
