import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  Entity,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from '@/src/posts/entities/post.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Chat } from '@/src/chats/entities/chat.entity';
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

  @OneToMany(() => BlockedUser, (blockedUser) => blockedUser.blockingUser)
  blockedUsers: BlockedUser[];

  @OneToMany(() => BlockedUser, (blockedUser) => blockedUser.blockedUser)
  blockedBy: BlockedUser[];

  @OneToMany(() => Follow, (follow) => follow.follower, { cascade: true })
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following, { cascade: true })
  following: Follow[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @ManyToMany(() => Notification, (notification) => notification.receivers)
  notifications: Notification[];

  @ManyToMany(() => Chat, (chat) => chat.users)
  chats: Chat[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  // bookmarks: Bookmark[];

  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  isFollowed?: boolean;

  @Expose({ groups: ['public', 'private', 'admin', 'profile'] })
  user_isFollowed?: number;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
