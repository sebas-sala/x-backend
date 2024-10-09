import { User } from '@/src/users/entities/user.entity';

interface SetChatUsers {
  currentUser: User;
  usersIds: string[];
}
