import { EntityManager } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

interface CreateChatMessage {
  chatId: string;
  sender: User;
  content?: string;
  manager?: EntityManager;
}
