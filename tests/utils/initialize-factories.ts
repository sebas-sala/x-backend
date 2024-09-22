import { DataSource } from 'typeorm';

import {
  UserFactory,
  PostFactory,
  LikeFactory,
  AuthFactory,
  FollowFactory,
  MessageFactory,
  ProfileFactory,
  CommentFactory,
  BlockedUserFactory,
} from './factories';

export async function initializeFactories(dataSource: DataSource) {
  // const authFactory = new AuthFactory(dataSource);
  const userFactory = new UserFactory(dataSource);
  const postFactory = new PostFactory(dataSource);
  const likeFactory = new LikeFactory(dataSource);
  const followFactory = new FollowFactory(dataSource);
  const messageFactory = new MessageFactory(dataSource);
  const profileFactory = new ProfileFactory(dataSource);
  const commentFactory = new CommentFactory(dataSource);
  const blockedUserFactory = new BlockedUserFactory(dataSource);

  return {
    userFactory,
    postFactory,
    likeFactory,
    followFactory,
    messageFactory,
    profileFactory,
    commentFactory,
    blockedUserFactory,
  };
}
