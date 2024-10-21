import { DataSource } from 'typeorm';

import { Chat } from '../chats/entities/chat.entity';
import { Like } from '../likes/entities/like.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Message } from '../messages/entities/message.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { BlockedUser } from '../blocked-users/entities/blocked-user.entity';
import { Notification } from '../notifications/entities/notification.entity';

export const repositories = (dataSource: DataSource) => {
  const chatRepository = dataSource.getRepository(Chat);
  const userRepository = dataSource.getRepository(User);
  const postRepository = dataSource.getRepository(Post);
  const likeRepository = dataSource.getRepository(Like);
  const followRepository = dataSource.getRepository(Follow);
  const commentRepository = dataSource.getRepository(Comment);
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
    commentRepository,
    profileRepository,
    messageRepository,
    blockedUserRepository,
    notificationRepository,
  };
};
