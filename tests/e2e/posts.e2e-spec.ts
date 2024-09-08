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

describe('Users API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let postFactory: PostFactory;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        UsersModule,
        AuthModule,
        PostsModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Follow, Profile, BlockedUser, Post]),

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
        postFactory.createPost({
          userId: currentUser.id,
        }),
        postFactory.createPost({
          userId: currentUser.id,
        }),
        postFactory.createPost({
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

      await postFactory.createPost({
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

      await postFactory.createPost({
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
});
