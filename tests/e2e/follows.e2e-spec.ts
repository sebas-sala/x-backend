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

import { ValidationPipe } from '@nestjs/common';
import { Follow } from '@/src/follows/entities/follow.entity';

import { AuthModule } from '@/src/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from '@/src/auth/auth.service';
import { JwtStrategy } from '@/src/auth/jwt.strategy';
import { faker } from '@faker-js/faker';
import FollowFactory from '../utils/factories/follow.factory';
import { setupTestApp } from '../utils/setup-test-app';

describe('Users API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let followFactory: FollowFactory;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;

    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    followFactory = setup.followFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({ sub: currentUser.id });
  });

  describe('POST /follows', () => {
    it(`should create a follow`, async () => {
      const user = await userFactory.createUserEntity();

      const result = await app.inject({
        method: 'POST',
        url: '/follows',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          followingId: user.id,
        },
      });

      expect(result.statusCode).toEqual(201);
    });

    it(`should return a 401 if the user is not authenticated`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/follows',
        payload: {
          followingId: '123',
        },
      });

      expect(result.statusCode).toEqual(401);
    });

    it(`should return a 404 if the user does not exist`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/follows',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          followingId: faker.string.uuid(),
        },
      });

      expect(result.statusCode).toEqual(404);
      expect(JSON.parse(result.payload)).toMatchObject({
        statusCode: 404,
        message: 'Following not found',
      });
    });

    it(`should return a 409 if the user is trying to follow themselves`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/follows',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          followingId: currentUser.id,
        },
      });

      const payload = JSON.parse(result.payload);

      expect(result.statusCode).toEqual(409);
      expect(payload).toMatchObject({
        statusCode: 409,
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
        url: '/follows',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          followingId: user.id,
        },
      });

      expect(result.statusCode).toEqual(409);
      expect(JSON.parse(result.payload)).toMatchObject({
        statusCode: 409,
        message: 'Follow already exists',
      });
    });
  });
});
