import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { Expose } from 'class-transformer';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bio?: string;

  @Expose({ groups: ['private'] })
  @Column({ nullable: true })
  location?: string;

  @Expose({ groups: ['private'] })
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

  constructor(partial: Partial<Profile>) {
    Object.assign(this, partial);
  }
}
