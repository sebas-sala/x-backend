import { DataSource } from 'typeorm';
import { User } from '@/src/users/entities/user.entity';
import { Post } from '@/src/posts/entities/post.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Chat } from '@/src/chats/entities/chat.entity';
import { Follow } from '@/src/follows/entities/follow.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';
import { Message } from '@/src/messages/entities/message.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';
import { Notification } from '@/src/notifications/entities/notification.entity';

export const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true,
  entities: [
    User,
    Post,
    Like,
    Chat,
    Follow,
    Profile,
    Message,
    BlockedUser,
    Notification,
  ],
});
