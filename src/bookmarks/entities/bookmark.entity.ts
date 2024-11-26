import { Post } from '@/src/posts/entities/post.entity';
import { User } from '@/src/users/entities/user.entity';

import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.bookmarks, {
    eager: true,
    nullable: false,
  })
  user: User;

  @ManyToOne(() => Post, (post) => post.bookmarks, {
    eager: true,
    nullable: false,
  })
  post: Post;
}
