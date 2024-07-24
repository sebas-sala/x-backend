import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/posts/entities/post.entity';

@Entity()
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.bookmarks)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Post, (post) => post.bookmarks)
  @JoinColumn()
  post: Post;
}
