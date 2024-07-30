import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  birthdate?: Date;

  @Column({ nullable: true })
  website?: string;

  @Column({ default: true })
  isPublic: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;

  // @OneToOne(() => Image, { cascade: true, nullable: true })
  // @JoinColumn()
  // avatar?: Image;

  // @OneToOne(() => Image, { cascade: true, nullable: true })
  // @JoinColumn()
  // cover?: Image;
}
