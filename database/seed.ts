import { factories } from './factories';
import { dataSource } from './data-source';
import { repositories } from './repositories';

export const seed = async () => {
  // const {
  //   userRepository,
  //   postRepository,
  //   commentRepository,
  //   likeRepository,
  //   followRepository,
  //   profileRepository,
  // } = repositories(dataSource);

  const {
    userFactory,
    postFactory,
    likeFactory,
    followFactory,
    profileFactory,
    commentFactory,
  } = factories(dataSource);

  const users = await userFactory.createManyUserEntities(10);

  const posts = [];

  for (const user of users) {
    await profileFactory.createProfileEntity(user);

    for (let i = 0; i < 5; i++) {
      const post = await postFactory.createPostEntity({
        userId: user.id,
      });
      posts.push(post);
    }

    if (user.id !== users[0].id) {
      await followFactory.createFollow({
        followerId: users[0].id,
        followingId: user.id,
      });
    }
  }

  for (const post of posts) {
    for (let i = 0; i < 10; i++) {
      await commentFactory.createPostCommentEntity({
        userId: users[i].id,
        postId: post.id,
      });
      await likeFactory.createPostLike(post.id, users[i].id);
    }
  }

  console.log('Database seeded successfully!');
};

const main = async () => {
  try {
    await dataSource.initialize();
    await seed();
    await dataSource.destroy();

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
