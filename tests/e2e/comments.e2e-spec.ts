import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import UserFactory from '../utils/factories/user.factory';
import { AppModule } from '@/src/app.module';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@/src/posts/entities/post.entity';
import { Comment } from '@/src/comments/entities/comment.entity';
import { User } from '@/src/users/entities/user.entity';
import { ValidationPipe } from '@nestjs/common';
import CommentFactory from '../utils/factories/comment.factory';
import PostFactory from '../utils/factories/post.factory';
import { UsersModule } from '@/src/users/users.module';
import { PostsModule } from '@/src/posts/posts.module';
import { LikesModule } from '@/src/likes/likes.module';
import { Follow } from '@/src/follows/entities/follow.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';
import { JwtStrategy } from '@/src/auth/jwt.strategy';
import { Like } from '@/src/likes/entities/like.entity';
import LikeFactory from '../utils/factories/like.factory';

describe('Comments', () => {
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
      providers: [JwtStrategy],
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

    await dataSource.query('PRAGMA foreign_keys = ON');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({ sub: currentUser.id });
  });

  describe('POST /comments/:id/replies', () => {
    it('should create a comment reply', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const comment = await commentFactory.createPostCommentEntity({
        postId: post.id,
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/comments/${comment.id}/replies`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          content: 'Reply content',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          content: 'Reply content',
          user: expect.objectContaining({
            id: currentUser.id,
          }),
          parent: expect.objectContaining({
            id: comment.id,
          }),
        }),
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const post = await postFactory.createPostEntity({
        userId: currentUser.id,
      });

      const comment = await commentFactory.createPostCommentEntity({
        postId: post.id,
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/comments/${comment.id}/replies`,
        payload: {
          content: 'Reply content',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 if comment does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/comments/1/replies',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          content: 'Reply content',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /comments/:id', () => {
    it('should update a comment', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/comments/${comment.id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          content: 'Updated comment content',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          id: comment.id,
          content: 'Updated comment content',
          user: expect.objectContaining({
            id: currentUser.id,
          }),
        }),
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/comments/${comment.id}`,
        payload: {
          content: 'Updated comment content',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 if comment does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/comments/1',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          content: 'Updated comment content',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Comment not found',
      });
    });

    it('should return 404 if comment does not belong to user', async () => {
      const mockUser = await userFactory.createUserEntity();
      const comment = await commentFactory.createCommentEntity({
        userId: mockUser.id,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/comments/${comment.id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          content: 'Updated comment content',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Comment not found',
      });
    });
  });

  describe('GET /comments/:id/likes', () => {
    it('should return comment likes', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      await likeFactory.createCommentLike(comment.id, currentUser.id);

      const response = await app.inject({
        method: 'GET',
        url: `/comments/${comment.id}/likes`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);

      expect(response.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            user: expect.objectContaining({
              id: currentUser.id,
            }),
          }),
        ]),
      );
    });
  });

  describe('POST /comments/:id/likes', () => {
    it('should like a comment', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/comments/${comment.id}/likes`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          comment: expect.objectContaining({
            id: comment.id,
          }),
          user: expect.objectContaining({
            id: currentUser.id,
          }),
        }),
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'POST',
        url: `/comments/${comment.id}/likes`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 if comment does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/comments/1/likes',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 if user already liked the comment', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      await likeFactory.createCommentLike(comment.id, currentUser.id);

      const response = await app.inject({
        method: 'POST',
        url: `/comments/${comment.id}/likes`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'Like already exists',
      });
    });
  });

  describe('DELETE /comments/:id/likes', () => {
    it('should unlike a comment', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      await likeFactory.createCommentLike(comment.id, currentUser.id);

      const response = await app.inject({
        method: 'DELETE',
        url: `/comments/${comment.id}/likes`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 401 if user is not authenticated', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      await likeFactory.createCommentLike(comment.id, currentUser.id);

      const response = await app.inject({
        method: 'DELETE',
        url: `/comments/${comment.id}/likes`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 if comment does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/comments/1/likes',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 if like does not exist', async () => {
      const comment = await commentFactory.createCommentEntity({
        userId: currentUser.id,
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/comments/${comment.id}/likes`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Like not found',
      });
    });
  });
});
