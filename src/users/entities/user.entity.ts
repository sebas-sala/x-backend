import { Exclude, Expose, Type } from 'class-transformer';
import {
  Column,
  Entity,
  OneToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from 'src/posts/entities/post.entity';
import { Like } from 'src/likes/entities/like.entity';
import { Follow } from 'src/follows/entities/follow.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Bookmark } from 'src/bookmarks/entities/bookmark.entity';
import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

@Entity()
export class User {
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Expose({ groups: ['public', 'profile', 'admin'] })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsEmail()
  @IsNotEmpty()
  @Expose({ groups: ['public', 'private', 'admin'] })
  @Column()
  name: string;

  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Expose({ groups: ['private', 'admin'] })
  @Column({ unique: true })
  email: string;

  @Expose({ groups: ['public', 'private', 'admin'] })
  @Column({ unique: true })
  username: string;

  @IsNotEmpty()
  @MaxLength(30)
  @IsStrongPassword()
  @Column()
  @Exclude()
  password: string;

  @Expose({ groups: ['public', 'private', 'admin'] })
  @CreateDateColumn()
  createdAt: Date;

  @Expose({ groups: ['public', 'private', 'admin'] })
  @UpdateDateColumn({ update: true })
  updatedAt: Date;

  // @OneToOne(() => Profile, (profile) => profile.user)
  // @JoinColumn()
  // profile: Profile;

  // @OneToMany(() => Post, (post) => post.user)
  // posts: Post[];

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
