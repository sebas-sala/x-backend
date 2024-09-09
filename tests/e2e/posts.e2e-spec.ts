import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/src/users/entities/user.entity';
import { UsersModule } from '@/src/users/users.module';

import UserFactory from '../utils/factories/user.factory';

import { Profile } from '@/src/profiles/entities/profile.entity';

import { ValidationPipe } from '@nestjs/common';
import { Follow } from '@/src/follows/entities/follow.entity';

import { AuthModule } from '@/src/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from '@/src/auth/auth.service';
import { JwtStrategy } from '@/src/auth/jwt.strategy';

import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';
import PostFactory from '../utils/factories/post.factory';
import { Post } from '@/src/posts/entities/post.entity';
import { PostsModule } from '@/src/posts/posts.module';
import { Comment } from '@/src/comments/entities/comment.entity';
import CommentFactory from '../utils/factories/comment.factory';
import { Like } from '@/src/likes/entities/like.entity';
import { LikesModule } from '@/src/likes/likes.module';
import LikeFactory from '../utils/factories/like.factory';

describe('Posts API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let postFactory: PostFactory;
  let commentFactory: CommentFactory;
  let likeFactory: LikeFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        UsersModule,
        AuthModule,
        PostsModule,
        LikesModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          User,
          Follow,
          Profile,
          BlockedUser,
          Post,
          Comment,
          Like,
        ]),

        JwtModule.register({
          secret: process.env.JWT_SECRET || 'secret',
          signOptions: { expiresIn: '60m' },
        }),
      ],
      providers: [AuthService, JwtStrategy],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    dataSource = moduleRef.get<DataSource>(DataSource);
    jwtService = moduleRef.get<JwtService>(JwtService);

    userFactory = new UserFactory(dataSource);
    postFactory = new PostFactory(dataSource);
    commentFactory = new CommentFactory(dataSource);
    likeFactory = new LikeFactory(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    await dataSource.query('PRAGMA foreign_keys = ON');
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await dataSource
      .getRepository(User)
      .save(UserFactory.createUserDto());

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
        error: 'Not Found',
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
        error: 'Not Found',
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
        error: 'Not Found',
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
        commentFactory.createComment({
          postId: post.id,
          userId: currentUser.id,
        }),
        commentFactory.createComment({
          postId: post.id,
          userId: currentUser.id,
        }),
        commentFactory.createComment({
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
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('GET /posts/:id/likes', () => {
    it('should return a list of likes', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const likes = await Promise.all([
        likeFactory.createPostLike(post.id, currentUser.id),
        likeFactory.createPostLike(post.id, currentUser.id),
        likeFactory.createPostLike(post.id, currentUser.id),
      ]);

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
      ).toEqual(likes.map((like) => like.id).sort());
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
        error: 'Not Found',
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
        error: 'Conflict',
        statusCode: 409,
      });
    });
  });
});
