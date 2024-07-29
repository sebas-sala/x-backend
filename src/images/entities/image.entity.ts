import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Post } from '@/src/posts/entities/post.entity';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  size?: number;

  @Column({ nullable: true })
  format?: string;

  @Column({ nullable: true })
  uploadedAt?: Date;

  @ManyToOne(() => Post, (post) => post.images)
  post: Post;
}
