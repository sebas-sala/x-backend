import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';

import { CreateUserDto } from '@/src/users/dto/create-user.dto';

import {
  UserFactory,
  FollowFactory,
  ProfileFactory,
  BlockedUserFactory,
} from '@/tests/utils/factories';

import { setupTestApp } from '../utils/setup-test-app';

describe('Users API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;

  let token: string;
  let currentUser: User;

  let userFactory: UserFactory;
  let followFactory: FollowFactory;
  let profileFactory: ProfileFactory;
  let blockedUserFactory: BlockedUserFactory;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;

    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    followFactory = setup.followFactory;
    profileFactory = setup.profileFactory;
    blockedUserFactory = setup.blockedUserFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({
      sub: currentUser.id,
      username: currentUser.username,
    });
  });

  describe('GET /users', () => {
    it(`should return an array of users`, async () => {
      const users = await Promise.all(
        Array.from({ length: 3 }, () => userFactory.createUserEntity()),
      );

      const result = await app.inject({
        method: 'GET',
        url: '/users',
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data.map((u) => u.id)).toEqual(
        expect.arrayContaining(users.map((u) => u.id)),
      );
    });

    it(`should return page 2 of users`, async () => {
      await Promise.all(
        Array.from({ length: 20 }, () => userFactory.createUserEntity()),
      );

      const result = await app.inject({
        method: 'GET',
        url: '/users?page=2',
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toHaveLength(6);
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
        status: 409,
        message: 'Email already exists',
      });
    });

    it('should return 409 if the username already exists', async () => {
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
        status: 409,
        message: 'Username already exists',
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
        status: 400,
        message: 'email must be an email',
      });
    });
  });

  describe(`GET /users/:id`, () => {
    it(`should return a user by id`, async () => {
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
        status: 404,
        message: 'User not found',
      });
    });
  });

  describe(`GET /users/:username/profile`, () => {
    it(`should return a user's profile`, async () => {
      const user = await userFactory.createUserEntity();
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
        status: 404,
        message: 'User not found',
      });
    });
  });

  describe(`/PATCH users/:id/profile`, () => {
    it(`should update a user's profile`, async () => {
      const result = await app.inject({
        method: 'PATCH',
        url: `/users/${currentUser.id}/profile`,
        payload: {
          bio: 'Test bio',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsedPayload = JSON.parse(result.payload) as Profile;
      expect(result.statusCode).toEqual(200);
      expect(parsedPayload).toMatchObject({
        bio: 'Test bio',
      });
    });

    it(`should return 400 if the payload is empty`, async () => {
      const user = await userFactory.createUserEntity();
      await profileFactory.createProfileEntity(user);

      const result = await app.inject({
        method: 'PATCH',
        url: `/users/${user.username}/profile`,
        payload: {},
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);
      expect(result.statusCode).toEqual(400);
      expect(payload).toMatchObject({
        status: 400,
        message: 'Payload cannot be empty',
      });
    });

    it(`should return 401 if the user is not authenticated`, async () => {
      const result = await app.inject({
        method: 'PATCH',
        url: `/users/x/profile`,
        payload: {
          bio: 'Test bio',
        },
      });

      const payload = JSON.parse(result.payload);
      expect(result.statusCode).toEqual(401);
      expect(payload).toMatchObject({
        status: 401,
        message: 'Unauthorized',
      });
    });
  });

  describe(`GET /users/:id/followers`, () => {
    it(`should return an array of followers`, async () => {
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
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data.map((f) => f.id)).toEqual(
        expect.arrayContaining(followers.map((f) => f.id)),
      );
    });

    it(`should return an empty array if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/2/followers',
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toEqual([]);
    });

    it(`should paginate followers`, async () => {
      const user = await userFactory.createUserEntity();
      await Promise.all(
        Array.from({ length: 20 }, async () => {
          const follower = await userFactory.createUserEntity();
          await followFactory.createFollow({
            followingId: user.id,
            followerId: follower.id,
          });
        }),
      );

      const result = await app.inject({
        method: 'GET',
        url: `/users/${user.id}/followers?page=2`,
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toHaveLength(5);
      expect(payload.meta.pagination).toMatchObject({
        page: 2,
        total: 20,
        totalPages: 2,
      });
    });
  });

  describe(`GET /users/:id/following`, () => {
    it(`should return an array of following`, async () => {
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
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data.map((f) => f.id)).toEqual(
        expect.arrayContaining(following.map((f) => f.id)),
      );
    });

    it(`should return an empty array if the user does not exists`, async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/users/2/following',
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toEqual([]);
    });

    it(`should paginate following`, async () => {
      const user = await userFactory.createUserEntity();
      await Promise.all(
        Array.from({ length: 20 }, async () => {
          const followed = await userFactory.createUserEntity();
          await followFactory.createFollow({
            followingId: followed.id,
            followerId: user.id,
          });
        }),
      );

      const result = await app.inject({
        method: 'GET',
        url: `/users/${user.id}/following?page=2`,
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toHaveLength(5);
      expect(payload.meta.pagination).toMatchObject({
        page: 2,
        total: 20,
        totalPages: 2,
      });
    });
  });

  describe(`GET /users/blocked`, () => {
    it(`should return an array of blocked users`, async () => {
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
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data.map((u) => u.id)).toEqual(
        expect.arrayContaining(blockedUsers.map((u) => u.id)),
      );
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
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toEqual([]);
    });

    it(`should paginate blocked users`, async () => {
      await Promise.all(
        Array.from({ length: 20 }, async () => {
          const blockedUser = await userFactory.createUserEntity();
          await blockedUserFactory.createBlockedUser({
            blockingUserId: currentUser.id,
            blockedUserId: blockedUser.id,
          });
        }),
      );

      const result = await app.inject({
        method: 'GET',
        url: `/users/blocked?page=2`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data as User[];
      expect(result.statusCode).toEqual(200);
      expect(data).toHaveLength(5);
      expect(payload.meta.pagination).toMatchObject({
        page: 2,
        total: 20,
        totalPages: 2,
      });
    });
  });

  describe(`POST /users/:id/block`, () => {
    it(`should block a user`, async () => {
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
        status: 404,
        message: `Blocked user not found`,
      });
    });

    it(`should return 409 if the user is already blocked`, async () => {
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
        status: 409,
        message: 'User already blocked',
      });
    });
  });

  describe(`DELETE /users/:id/unblock`, () => {
    it(`should unblock a user`, async () => {
      const blockedUser = await userFactory.createUserEntity();
      await blockedUserFactory.createBlockedUser({
        blockingUserId: currentUser.id,
        blockedUserId: blockedUser.id,
      });

      const result = await app.inject({
        method: 'DELETE',
        url: `/users/${blockedUser.id}/unblock`,
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
        status: 404,
        message: `Blocked user not found`,
      });
    });
  });
});
