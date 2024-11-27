import { DataSource } from 'typeorm';

import { Chat } from '@/src/chats/entities/chat.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { User } from '@/src/users/entities/user.entity';
import { Post } from '@/src/posts/entities/post.entity';
import { Follow } from '@/src/follows/entities/follow.entity';
import { Message } from '@/src/messages/entities/message.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';
import { Notification } from '@/src/notifications/entities/notification.entity';

export const repositories = (dataSource: DataSource) => {
  const chatRepository = dataSource.getRepository(Chat);
  const userRepository = dataSource.getRepository(User);
  const postRepository = dataSource.getRepository(Post);
  const likeRepository = dataSource.getRepository(Like);
  const followRepository = dataSource.getRepository(Follow);
  const profileRepository = dataSource.getRepository(Profile);
  const messageRepository = dataSource.getRepository(Message);
  const blockedUserRepository = dataSource.getRepository(BlockedUser);
  const notificationRepository = dataSource.getRepository(Notification);

  return {
    chatRepository,
    userRepository,
    postRepository,
    likeRepository,
    followRepository,
    profileRepository,
    messageRepository,
    blockedUserRepository,
    notificationRepository,
  };
};
