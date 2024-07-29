import {
  Column,
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { Image } from '@/src/images/entities/image.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @OneToOne(() => Image, { cascade: true, nullable: true })
  @JoinColumn()
  image?: Image;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @OneToOne(() => Comment, (comment) => comment.replies)
  parent?: Comment;
}
