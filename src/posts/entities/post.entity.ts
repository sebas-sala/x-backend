import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

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

  // @OneToMany(() => Image, (image) => image.post)
  // images: Image[];

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.post)
  // bookmarks: Bookmark[];

  // @OneToMany(() => Like, (like) => like.post)
  // likes: Like[];

  // @ManyToOne(() => User, (user) => user.posts)
  // user: User;
}
