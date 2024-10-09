import { EntityManager } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

interface CreateChat {
  users: User[];
  name?: string;
  isChatGroup?: boolean;
  manager?: EntityManager;
}
