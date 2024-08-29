import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/src/users/entities/user.entity';
import { UsersModule } from '@/src/users/users.module';
import { CreateUserDto } from '@/src/users/dto/create-user.dto';
import UserFactory from '../utils/factories/user.factory';

import { Profile } from '@/src/profiles/entities/profile.entity';
import ProfileFactory from '../utils/factories/profile.factory';

import { ValidationPipe } from '@nestjs/common';
import { Follow } from '@/src/follows/entities/follow.entity';
import FollowFactory from '../utils/factories/follow.factory';
import { AuthModule } from '@/src/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from '@/src/auth/auth.service';
import { JwtStrategy } from '@/src/auth/jwt.strategy';
import BlockedUserFactory from '../utils/factories/blocked-user.factory';

describe('Users API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        UsersModule,
        AuthModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Follow]),
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await dataSource
      .getRepository(User)
      .save(UserFactory.createUserDto());

    token = jwtService.sign({ sub: currentUser.id });
  });

  describe('GET /users', () => {
    it(`should return an array of users`, async () => {
      const userFactory = new UserFactory(dataSource);

      const users = await Promise.all(
        Array.from({ length: 3 }, () => userFactory.createUserEntity()),
      );

      const result = await app.inject({
        method: 'GET',
        url: '/users',
      });

      const payload = JSON.parse(result.payload);
      expect(result.statusCode).toEqual(200);
      expect(payload.map((u: { id: string }) => u.id)).toEqual(
        expect.arrayContaining(users.map((u) => u.id)),
      );
    });

    it('should return an empty array if there are no users', async () => {
      await dataSource.synchronize(true);

      const result = await app.inject({
        method: 'GET',
        url: '/users',
      });

      const parsedPayload = JSON.parse(result.payload) as User[];

      expect(result.statusCode).toEqual(200);
      expect(parsedPayload.length).toEqual(0);
    });
  });

  describe(`POST /users`, () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = UserFactory.createUserDto();

      const result = await app.inject({
        method: 'POST',
        url: '/users',
        payload: createUserDto,
      });

      const createdUser = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(201);
      expect(createdUser).toMatchObject({
        name: createUserDto.name,
        username: createUserDto.username,
      });
      expect(createdUser).toHaveProperty('id');
      expect(createdUser).toHaveProperty('createdAt');
      expect(createdUser).toHaveProperty('updatedAt');
      expect(
        await dataSource.getRepository(Profile).exists(createdUser.id),
      ).toBe(true);
    });

    it('should return 409 if the email already exists', async () => {
      const userFactory = new UserFactory(dataSource);

      const existingUser = await userFactory.createUserEntity();

      const createUserDto: CreateUserDto = UserFactory.createUserDto({
        email: existingUser.email,
      });

      const result = await app.inject({
        method: 'POST',
        url: '/users',
        payload: createUserDto,
      });

      expect(result.statusCode).toBe(409);
      expect(JSON.parse(result.payload)).toMatchObject({
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      });
    });

    it('should return 409 if the username already exists', async () => {
      const userFactory = new UserFactory(dataSource);

      const existingUser = await userFactory.createUserEntity();
      const createUserDto: CreateUserDto = UserFactory.createUserDto({
        username: existingUser.username,
      });

      const result = await app.inject({
        method: 'POST',
        url: '/users',
        payload: createUserDto,
      });

      expect(result.statusCode).toEqual(409);
      expect(JSON.parse(result.payload)).toMatchObject({
        statusCode: 409,
        message: 'Username already exists',
        error: 'Conflict',
      });
    });

    it('should return 400 if the email is invalid', async () => {
      const createUserDto: CreateUserDto = UserFactory.createUserDto({
        email: 'invalid-email',
      });

      const result = await app.inject({
        method: 'POST',
        url: '/users',
        payload: createUserDto,
      });

      expect(result.statusCode).toEqual(400);
      expect(JSON.parse(result.payload)).toMatchObject({
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      });
    });
  });

  describe(`GET /users/:id`, () => {
    it(`should return a user by id`, async () => {
      const userFactory = new UserFactory(dataSource);

      const user = await userFactory.createUserEntity();

      const result = await app.inject({
        method: 'GET',
        url: `/users/${user.id}`,
      });

      const payload = JSON.parse(result.payload) as User;

      expect(result.statusCode).toEqual(200);
      expect(payload).toMatchObject({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      });
    });

    it(`should return 404 if the user does not exist by id`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/2',
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(404);
      expect(payload).toMatchObject({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    });
  });

  describe(`GET /users/:username/profile`, () => {
    it(`should return a user's profile`, async () => {
      const userFactory = new UserFactory(dataSource);

      const user = await userFactory.createUserEntity();

      const profileFactory = new ProfileFactory(dataSource);

      const profile = await profileFactory.createProfileEntity(user);

      const result = await app.inject({
        method: 'GET',
        url: `/users/${user.username}/profile`,
      });

      const payload = JSON.parse(result.payload) as User;

      expect(result.statusCode).toEqual(200);
      expect(payload).toMatchObject({
        id: user.id,
        name: user.name,
        username: user.username,
        profile: {
          id: profile.id,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          isPublic: profile.isPublic,
        },
      });
      expect(payload.profile).toHaveProperty('birthdate');
    });

    it(`sohuld return 404 if the user does not exist by username`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/2/profile',
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(404);
      expect(payload).toMatchObject({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    });
  });

  describe(`/PATCH users/:id/profile`, () => {
    it(`should update a user's profile`, async () => {
      const userFactory = new UserFactory(dataSource);
      const profileFactory = new ProfileFactory(dataSource);

      const user = await userFactory.createUserEntity();
      await profileFactory.createProfileEntity(user);

      const result = await app.inject({
        method: 'PATCH',
        url: `/users/${user.id}/profile`,
        payload: {
          bio: 'Test bio',
        },
      });

      const parsedPayload = JSON.parse(result.payload) as Profile;

      expect(result.statusCode).toEqual(200);
      expect(parsedPayload).toMatchObject({
        bio: 'Test bio',
      });
    });

    it(`should return 404 if the user does not exist by username`, async () => {
      const result = await app.inject({
        method: 'PATCH',
        url: '/users/2/profile',
        payload: {
          bio: 'Test bio',
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(404);
      expect(payload).toMatchObject({
        statusCode: 404,
        message: 'Profile not found',
        error: 'Not Found',
      });
    });

    it(`should return 400 if the payload is empty`, async () => {
      const userFactory = new UserFactory(dataSource);
      const profileFactory = new ProfileFactory(dataSource);

      const user = await userFactory.createUserEntity();
      await profileFactory.createProfileEntity(user);

      const result = await app.inject({
        method: 'PATCH',
        url: `/users/${user.username}/profile`,
        payload: {},
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(400);
      expect(payload).toMatchObject({
        statusCode: 400,
        message: 'Payload cannot be empty',
        error: 'Bad Request',
      });
    });
  });

  describe(`GET /users/:id/followers`, () => {
    it(`should return an array of followers`, async () => {
      const userFactory = new UserFactory(dataSource);
      const followFactory = new FollowFactory(dataSource);

      const user = await userFactory.createUserEntity();
      const followers = await Promise.all(
        Array.from({ length: 3 }, async () => {
          const follower = await userFactory.createUserEntity();
          await followFactory.createFollow({
            followingId: user.id,
            followerId: follower.id,
          });
          return follower;
        }),
      );

      const result = await app.inject({
        method: 'GET',
        url: `/users/${user.id}/followers`,
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(payload.map((f: { id: string }) => f.id)).toEqual(
        expect.arrayContaining(followers.map((f) => f.id)),
      );
    });

    it(`should return an empty array if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/2/followers',
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(payload).toEqual([]);
    });
  });

  describe(`GET /users/:id/following`, () => {
    it(`should return an array of following`, async () => {
      const userFactory = new UserFactory(dataSource);
      const followFactory = new FollowFactory(dataSource);

      const user = await userFactory.createUserEntity();
      const following = await Promise.all(
        Array.from({ length: 3 }, async () => {
          const followed = await userFactory.createUserEntity();
          await followFactory.createFollow({
            followingId: followed.id,
            followerId: user.id,
          });
          return followed;
        }),
      );

      const result = await app.inject({
        method: 'GET',
        url: `/users/${user.id}/following`,
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(payload.map((f: { id: string }) => f.id)).toEqual(
        expect.arrayContaining(following.map((f) => f.id)),
      );
    });

    it(`should return an empty array if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/2/following',
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(payload).toEqual([]);
    });
  });

  describe(`GET /users/blocked`, () => {
    it(`should return an array of blocked users`, async () => {
      const userFactory = new UserFactory(dataSource);
      const blockedUserFactory = new BlockedUserFactory(dataSource);

      const blockedUsers = await Promise.all(
        Array.from({ length: 3 }, async () => {
          const blockedUser = await userFactory.createUserEntity();

          await blockedUserFactory.createBlockedUser({
            blockingUserId: currentUser.id,
            blockedUserId: blockedUser.id,
          });
          return blockedUser;
        }),
      );

      const result = await app.inject({
        method: 'GET',
        url: `/users/blocked`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(
        payload.map((u: { id: string; blockedUser: { id: string } }) => {
          return u.blockedUser.id;
        }),
      ).toEqual(expect.arrayContaining(blockedUsers.map((u) => u.id)));
    });

    it(`should return an empty array if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/blocked',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(payload).toEqual([]);
    });
  });

  describe(`POST /users/:id/block`, () => {
    it(`should block a user`, async () => {
      const userFactory = new UserFactory(dataSource);

      const user = await userFactory.createUserEntity();

      const result = await app.inject({
        method: 'POST',
        url: `/users/${user.id}/block`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(201);
      expect(payload).toMatchObject({
        blockedUser: {
          id: user.id,
        },
        blockingUser: {
          id: currentUser.id,
        },
      });
    });

    it(`should return 404 if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/users/2/block',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(404);
      expect(payload).toMatchObject({
        statusCode: 404,
        message: `Blocked user with ID ${2} not found`,
        error: 'Not Found',
      });
    });

    it(`should return 409 if the user is already blocked`, async () => {
      const userFactory = new UserFactory(dataSource);
      const blockedUserFactory = new BlockedUserFactory(dataSource);

      const user = await userFactory.createUserEntity();

      await blockedUserFactory.createBlockedUser({
        blockingUserId: currentUser.id,
        blockedUserId: user.id,
      });

      const result = await app.inject({
        method: 'POST',
        url: `/users/${user.id}/block`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(409);
      expect(payload).toMatchObject({
        statusCode: 409,
        message: 'User already blocked',
        error: 'Conflict',
      });
    });
  });

  describe(`DELETE /users/:id/unblock`, () => {
    it(`should unblock a user`, async () => {
      const userFactory = new UserFactory(dataSource);
      const blockedUserFactory = new BlockedUserFactory(dataSource);

      const user = await userFactory.createUserEntity();

      await blockedUserFactory.createBlockedUser({
        blockingUserId: currentUser.id,
        blockedUserId: user.id,
      });

      const result = await app.inject({
        method: 'DELETE',
        url: `/users/${user.id}/unblock`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(200);
      expect(payload).toBe(1);
    });

    it(`should return 404 if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'DELETE',
        url: '/users/2/unblock',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(404);
      expect(payload).toMatchObject({
        statusCode: 404,
        message: `Blocked user with ID ${2} not found`,
        error: 'Not Found',
      });
    });
  });
});
