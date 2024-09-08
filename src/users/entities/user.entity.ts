import { Exclude, Expose } from 'class-transformer';
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

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ApiHideProperty } from '@nestjs/swagger';
import { Follow } from '@/src/follows/entities/follow.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';
import { Post } from '@/src/posts/entities/post.entity';

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

  @Expose({ groups: ['profile', 'admin'] })
  @OneToMany(() => BlockedUser, (blockedUser) => blockedUser.blockingUser)
  blockedUsers: BlockedUser[];

  @Expose({ groups: ['profile', 'admin'] })
  @OneToMany(() => BlockedUser, (blockedUser) => blockedUser.blockedUser)
  blockedBy: BlockedUser[];

  // @ApiHideProperty()
  // @OneToMany(() => Post, (post) => post.user)
  // posts: Post[];

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  // bookmarks: Bookmark[];

  // @OneToMany(() => Like, (like) => like.user)
  // likes: Like[];

  // @OneToMany(() => Comment, (comment) => comment.user)
  // comments: Comment[];

  @ApiHideProperty()
  @OneToMany(() => Follow, (follow) => follow.follower, { cascade: true })
  followers: Follow[];

  @ApiHideProperty()
  @OneToMany(() => Follow, (follow) => follow.following, { cascade: true })
  following: Follow[];

  @ApiHideProperty()
  @OneToMany(() => Follow, (follow) => follow.follower)
  posts: Post[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
