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

describe('Comments', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let postFactory: PostFactory;
  let commentFactory: CommentFactory;

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
});
