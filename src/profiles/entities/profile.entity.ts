import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Image } from 'src/images/entities/image.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bio: string;

  @Column()
  location: string;

  @Column()
  birthdate: Date;

  @Column()
  website: string;

  @Column()
  isPublic: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Image, { cascade: true, nullable: true })
  @JoinColumn()
  avatar?: Image;

  @OneToOne(() => Image, { cascade: true, nullable: true })
  @JoinColumn()
  cover?: Image;

  // @OneToOne(() => User, (user) => user.profile)
  // @JoinColumn()
  // user: User;
}
