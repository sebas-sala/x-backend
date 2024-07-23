import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @Expose({ groups: ['profile', 'admin'] })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose({ groups: ['public', 'profile', 'admin'] })
  @Column()
  name: string;

  @Expose({ groups: ['profile', 'admin'] })
  @Column({ unique: true })
  email: string;

  @Expose({ groups: ['public', 'profile', 'admin'] })
  @Column({ unique: true })
  username: string;

  @Column()
  @Expose({ groups: ['admin'] })
  password: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
