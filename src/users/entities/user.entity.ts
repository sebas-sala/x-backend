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
import { ApiHideProperty } from '@nestjs/swagger';

import { Post } from '@/src/posts/entities/post.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Follow } from '@/src/follows/entities/follow.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';
import { Comment } from '@/src/comments/entities/comment.entity';
import { Message } from '@/src/messages/entities/message.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';
import { Notification } from '@/src/notifications/entities/notification.entity';

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

  @ApiHideProperty()
  @OneToMany(() => Follow, (follow) => follow.follower, { cascade: true })
  followers: Follow[];

  @ApiHideProperty()
  @OneToMany(() => Follow, (follow) => follow.following, { cascade: true })
  following: Follow[];

  @ApiHideProperty()
  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Notification, (notification) => notification.receiver)
  notifications: Notification[];

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  // bookmarks: Bookmark[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
