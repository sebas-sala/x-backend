import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Post } from '@/src/posts/entities/post.entity';

import {
  UserFactory,
  PostFactory,
  LikeFactory,
  BlockedUserFactory,
} from '../utils/factories';

import { setupTestApp } from '../utils/setup-test-app';
import { Notification } from '@/src/notifications/entities/notification.entity';

describe('Posts API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let postFactory: PostFactory;
  let likeFactory: LikeFactory;
  let blockedUserFactory: BlockedUserFactory;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;
    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    postFactory = setup.postFactory;
    likeFactory = setup.likeFactory;
    blockedUserFactory = setup.blockedUserFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({ sub: currentUser.id });
  });

  describe('GET /posts', () => {
    it('should return a list of posts', async () => {
      const posts = await Promise.all(
        Array.from(
          { length: 3 },
          async () =>
            await postFactory.createPostEntity({
              userId: currentUser.id,
            }),
        ),
      );

      const response = await app.inject({
        method: 'GET',
        url: '/posts',
        cookies: {
          __session: token,
        },
      });

      const payload = JSON.parse(response.payload);
      const data = payload.data as Post[];
      expect(response.statusCode).toBe(200);
      expect(data.map((post) => post.id).sort()).toEqual(
        posts.map((post) => post.id).sort(),
      );
    });

    it('should return not return posts from blocked users', async () => {
      const blockingUser = await userFactory.createUserEntity();

      await blockedUserFactory.createBlockedUser({
        blockingUserId: blockingUser.id,
        blockedUserId: currentUser.id,
      });
      await postFactory.createPostEntity({
        userId: blockingUser.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/posts',
        cookies: {
          __session: token,
        },
      });

      const payload = JSON.parse(response.payload);
      const data = payload.data as Post[];
      expect(response.statusCode).toBe(200);
      expect(data).toHaveLength(0);
    });

    it('should return posts filtered by username', async () => {
      const user = await userFactory.createUserEntity();
      const post = await postFactory.createPostEntity({
        userId: user.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/posts?by_username=${user.username}`,
        cookies: {
          __session: token,
        },
      });

      const payload = JSON.parse(response.payload);
      const data = payload.data as Post[];
      expect(response.statusCode).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(post.id);
    });

    it('should return posts from page 2', async () => {
      await Promise.all(
        Array.from({ length: 12 }, async (_, index) => {
          return await postFactory.createPostEntity({
            userId: currentUser.id,
            content: `Post ${index}`,
          });
        }),
      );

      const response = await app.inject({
        method: 'GET',
        url: '/posts?page=2&perPage=5',
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      const data = payload.data as Post[];
      expect(data).toHaveLength(5);
    });

    it('should return return posts from blocked users if youre not authenticated', async () => {
      const blockingUser = await userFactory.createUserEntity();
      await blockedUserFactory.createBlockedUser({
        blockingUserId: blockingUser.id,
        blockedUserId: currentUser.id,
      });
      await postFactory.createPostEntity({
        userId: blockingUser.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/posts',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.data).toHaveLength(1);
    });
  });

  describe('POST /posts', () => {
    it('should create a post', async () => {
      const post = PostFactory.createPostDto();

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        cookies: {
          __session: token,
        },
        payload: post,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toMatchObject(post);
    });

    it('should return a 401 if the user is not authenticated', async () => {
      const post = {
        content: 'This is a post',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        payload: post,
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Unauthorized',
        status: 401,
      });
    });
  });

  describe('GET /posts/:id', () => {
    it('should return a post', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/posts/${post.id}`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toMatchObject({
        content: post.content,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/posts/1',
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        status: 404,
      });
    });
  });

  describe('PATCH /posts/:id', () => {
    it('should update a post', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });
      const updatedPost = PostFactory.createPostDto();

      const response = await app.inject({
        method: 'PATCH',
        url: `/posts/${post.id}`,
        cookies: {
          __session: token,
        },
        payload: updatedPost,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toMatchObject(updatedPost);
    });

    it('should return a 401 if the user is not authenticated', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/posts/${post.id}`,
        payload: PostFactory.createPostDto(),
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Unauthorized',
        status: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/posts/1',
        cookies: {
          __session: token,
        },
        payload: PostFactory.createPostDto(),
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        status: 404,
      });
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete a post', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/posts/${post.id}`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return a 401 if the user is not authenticated', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/posts/${post.id}`,
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Unauthorized',
        status: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/posts/1',
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        status: 404,
      });
    });
  });

  describe('GET /posts/:id/likes', () => {
    it('should return a list of likes', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });
      const likes = await likeFactory.createPostLike(post.id, currentUser.id);

      const response = await app.inject({
        method: 'GET',
        url: `/posts/${post.id}/likes`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(
        JSON.parse(response.payload)
          .map((like: Like) => like.id)
          .sort(),
      ).toEqual([likes.id]);
    });
  });

  describe('POST /posts/:id/likes', () => {
    it('should like a post', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/posts/${post.id}/likes`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toMatchObject({
        post: { id: post.id },
        user: { id: currentUser.id },
      });
      expect(
        dataSource.getRepository(Notification).find(),
      ).resolves.toHaveLength(1);
    });

    it('should return a 401 if the user is not authenticated', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/posts/${post.id}/likes`,
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Unauthorized',
        status: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/likes',
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        status: 404,
      });
    });

    it('should return a 409 if the post is already liked', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });
      await likeFactory.createPostLike(post.id, currentUser.id);

      const response = await app.inject({
        method: 'POST',
        url: `/posts/${post.id}/likes`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Like already exists',
        error: 'ConflictException',
        status: 409,
      });
    });
  });

  describe('DELETE /posts/:id/likes', () => {
    it('should unlike a post', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });
      await likeFactory.createPostLike(post.id, currentUser.id);

      const response = await app.inject({
        method: 'DELETE',
        url: `/posts/${post.id}/likes`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return a 401 if the user is not authenticated', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/posts/${post.id}/likes`,
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Unauthorized',
        status: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/posts/1/likes',
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        status: 404,
      });
    });

    it('should return a 404 if the like does not exist', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/posts/${post.id}/likes`,
        cookies: {
          __session: token,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Like not found',
        error: 'NotFoundException',
        status: 404,
      });
    });
  });
});
