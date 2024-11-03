import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';
import { Follow } from '@/src/follows/entities/follow.entity';

import { UserFactory } from '@/tests/utils/factories';
import { setupTestApp } from '../utils/setup-test-app';
import { Notification } from '@/src/notifications/entities/notification.entity';
import { io, Socket } from 'socket.io-client';

describe('Follows API (e2e)', () => {
  let app: NestFastifyApplication;
  let socket: Socket;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;

  let port: number;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;
    port = setup.currentPort;

    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    socket.disconnect();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({ sub: currentUser.id });

    socket = io(`http://localhost:${port}/notifications`, {
      reconnection: false,
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => resolve(true));
      socket.on('error', reject);
    });
  });

  describe('POST /users/:id/follow', () => {
    it(`should create a follow`, async () => {
      const user = await userFactory.createUserEntity();

      const result = await app.inject({
        method: 'POST',
        url: `/users/${user.id}/follow`,
        cookies: {
          __session: token,
        },
        payload: {
          followingId: user.id,
        },
      });

      expect(result.statusCode).toEqual(201);
      expect(dataSource.getRepository(Notification).count()).resolves.toEqual(
        1,
      );
    });

    it(`should return a 401 if the user is not authenticated`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/users/${currentUser.id}/follow`,
        payload: {
          followingId: '123',
        },
      });

      expect(result.statusCode).toEqual(401);
    });

    it(`should return a 404 if the user does not exist`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/users/1/follow`,
        cookies: {
          __session: token,
        },
        payload: {
          followingId: faker.string.uuid(),
        },
      });

      expect(result.statusCode).toEqual(404);
      expect(JSON.parse(result.payload)).toMatchObject({
        status: 404,
        message: 'Following not found',
      });
    });

    it(`should return a 409 if the user is trying to follow themselves`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: `/users/${currentUser.id}/follow`,
        cookies: {
          __session: token,
        },
        payload: {
          followingId: currentUser.id,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(409);
      expect(payload).toMatchObject({
        status: 409,
        message: 'You cannot follow yourself',
      });
    });

    it(`should return a 409 if the user is already following the user`, async () => {
      const userFactory = new UserFactory(dataSource);

      const user = await userFactory.createUserEntity();

      await dataSource.getRepository(Follow).save({
        follower: currentUser,
        following: user,
      });

      const result = await app.inject({
        method: 'POST',
        url: `/users/${currentUser.id}/follow`,
        cookies: {
          __session: token,
        },
        payload: {
          followingId: user.id,
        },
      });

      expect(result.statusCode).toEqual(409);
      expect(JSON.parse(result.payload)).toMatchObject({
        status: 409,
        message: 'Follow already exists',
      });
    });
  });
});
