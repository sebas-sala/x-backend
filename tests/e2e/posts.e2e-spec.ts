import { DataSource } from 'typeorm';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';

import { User } from '@/src/users/entities/user.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Post } from '@/src/posts/entities/post.entity';
import { Comment } from '@/src/comments/entities/comment.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';

import UserFactory from '../utils/factories/user.factory';
import PostFactory from '../utils/factories/post.factory';
import LikeFactory from '../utils/factories/like.factory';
import CommentFactory from '../utils/factories/comment.factory';

import { setupTestApp } from '../utils/setup-test-app';

describe('Posts API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let postFactory: PostFactory;
  let likeFactory: LikeFactory;
  let commentFactory: CommentFactory;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;
    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    postFactory = setup.postFactory;
    likeFactory = setup.likeFactory;
    commentFactory = setup.commentFactory;
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
      const posts = await Promise.all([
        postFactory.createPostEntity({
          userId: currentUser.id,
        }),
        postFactory.createPostEntity({
          userId: currentUser.id,
        }),
        postFactory.createPostEntity({
          userId: currentUser.id,
        }),
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/posts',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(
        JSON.parse(response.payload)
          .map((post: Post) => post.id)
          .sort(),
      ).toEqual(posts.map((post) => post.id).sort());
    });

    it('should return not return posts from blocked users', async () => {
      const blockingUser = await userFactory.createUserEntity();

      await dataSource
        .getRepository(BlockedUser)
        .save({ blockingUser, blockedUser: currentUser });

      await postFactory.createPostEntity({
        userId: blockingUser.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/posts',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual([]);
    });

    it('should return return posts from blocked users if youre not authenticated', async () => {
      const blockingUser = await userFactory.createUserEntity();

      await dataSource
        .getRepository(BlockedUser)
        .save({ blockingUser, blockedUser: currentUser });

      await postFactory.createPostEntity({
        userId: blockingUser.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/posts',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).length).toBe(1);
    });
  });

  describe('POST /posts', () => {
    it('should create a post', async () => {
      const post = PostFactory.createPostDto();

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          Authorization: `Bearer ${token}`,
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
        statusCode: 401,
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
        headers: {
          Authorization: `Bearer ${token}`,
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        statusCode: 404,
      });
    });
  });

  describe('GET /posts/:id/comments', () => {
    it('should return a list of comments', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const comments = await Promise.all([
        commentFactory.createPostCommentEntity({
          postId: post.id,
          userId: currentUser.id,
        }),
        commentFactory.createPostCommentEntity({
          postId: post.id,
          userId: currentUser.id,
        }),
        commentFactory.createPostCommentEntity({
          postId: post.id,
          userId: currentUser.id,
        }),
      ]);

      const response = await app.inject({
        method: 'GET',
        url: `/posts/${post.id}/comments`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(
        JSON.parse(response.payload)
          .map((comment: Comment) => comment.id)
          .sort(),
      ).toEqual(comments.map((comment) => comment.id).sort());
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/posts/1/comments',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        statusCode: 404,
      });
    });
  });

  describe('POST /posts/:id/comments', () => {
    it('should create a comment', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const comment = CommentFactory.createCommentDto();

      const response = await app.inject({
        method: 'POST',
        url: `/posts/${post.id}/comments`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: comment,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toMatchObject(comment);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const comment = {
        content: 'This is a comment',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/posts/${post.id}/comments`,
        payload: comment,
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/comments',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          content: 'This is a comment',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        statusCode: 404,
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
        headers: {
          Authorization: `Bearer ${token}`,
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
        statusCode: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/posts/1',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: PostFactory.createPostDto(),
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found',
        error: 'NotFoundException',
        statusCode: 404,
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
          headers: {
            Authorization: `Bearer ${token}`,
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
          statusCode: 401,
        });
      });

      it('should return a 404 if the post does not exist', async () => {
        const response = await app.inject({
          method: 'DELETE',
          url: '/posts/1',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.payload)).toMatchObject({
          message: 'Post not found',
          error: 'NotFoundException',
          statusCode: 404,
        });
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
        headers: {
          Authorization: `Bearer ${token}`,
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toMatchObject({
        post: { id: post.id },
        user: { id: currentUser.id },
      });
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
        statusCode: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/likes',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found by id ' + 1,
        error: 'NotFoundException',
        statusCode: 404,
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Like already exists',
        error: 'ConflictException',
        statusCode: 409,
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
        headers: {
          Authorization: `Bearer ${token}`,
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
        statusCode: 401,
      });
    });

    it('should return a 404 if the post does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/posts/1/likes',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Post not found by id ' + 1,
        error: 'NotFoundException',
        statusCode: 404,
      });
    });

    it('should return a 404 if the like does not exist', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/posts/${post.id}/likes`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        message: 'Like not found',
        error: 'NotFoundException',
        statusCode: 404,
      });
    });
  });
});
