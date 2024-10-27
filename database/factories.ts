import { DataSource } from 'typeorm';

import {
  UserFactory,
  AuthFactory,
  BlockedUserFactory,
  ChatFactory,
  CommentFactory,
  LikeFactory,
  MessageFactory,
  PostFactory,
  FollowFactory,
  ProfileFactory,
} from '@/tests/utils/factories';

export function factories(dataSource: DataSource) {
  const userFactory = new UserFactory(dataSource);
  const chatFactory = new ChatFactory(dataSource);
  const likeFactory = new LikeFactory(dataSource);
  const postFactory = new PostFactory(dataSource);
  const followFactory = new FollowFactory(dataSource);
  const commentFactory = new CommentFactory(dataSource);
  const messageFactory = new MessageFactory(dataSource);
  const profileFactory = new ProfileFactory(dataSource);
  const blockedUserFactory = new BlockedUserFactory(dataSource);

  return {
    userFactory,
    chatFactory,
    likeFactory,
    postFactory,
    followFactory,
    commentFactory,
    messageFactory,
    profileFactory,
    blockedUserFactory,
  };
}
