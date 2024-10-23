import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Like } from '../likes/entities/like.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Message } from '../messages/entities/message.entity';
import { BlockedUser } from '../blocked-users/entities/blocked-user.entity';
import { Notification } from '../notifications/entities/notification.entity';

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
    Comment,
    Message,
    BlockedUser,
    Notification,
  ],
});
