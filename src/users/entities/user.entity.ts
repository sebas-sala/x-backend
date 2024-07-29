import { Exclude, Expose, Type } from 'class-transformer';
import {
  Column,
  Entity,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';

import { Post } from 'src/posts/entities/post.entity';
import { Like } from 'src/likes/entities/like.entity';
import { Follow } from 'src/follows/entities/follow.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Bookmark } from 'src/bookmarks/entities/bookmark.entity';

@Entity()
export class User {
  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  @Column()
  name: string;

  @Expose({ groups: ['private', 'admin'] })
  @Column({ unique: true })
  email: string;

  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  @CreateDateColumn()
  createdAt: Date;

  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  @UpdateDateColumn({ update: true })
  updatedAt: Date;

  @Expose({ groups: ['profile', 'admin'] })
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  // bookmarks: Bookmark[];

  // @OneToMany(() => Like, (like) => like.user)
  // likes: Like[];

  // @OneToMany(() => Comment, (comment) => comment.user)
  // comments: Comment[];

  // @OneToMany(() => Follow, (follow) => follow.follower)
  // followers: Follow[];

  // @OneToMany(() => Follow, (follow) => follow.following)
  // following: Follow[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
