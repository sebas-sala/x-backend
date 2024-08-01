import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/src/users/entities/user.entity';
import { UsersModule } from '@/src/users/users.module';

import { Post } from '@/src/posts/entities/post.entity';

import { Profile } from '@/src/profiles/entities/profile.entity';

import {
  userDtoFactory,
  userEntityFactory,
} from '@/tests/utils/factories/user.factory';

import { CreateUserDto } from '@/src/users/dto/create-user.dto';
import { DataSource } from 'typeorm';
import { profileEntityFactory } from '../utils/factories/profile.factory';

describe('Users API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Profile, Post],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    dataSource = moduleRef.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  describe('GET /users', () => {
    it(`should return an array of users`, async () => {
      const users = await Promise.all(
        Array.from({ length: 3 }, () => userEntityFactory({ dataSource })),
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
      const createUserDto: CreateUserDto = userDtoFactory();

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
    });

    it('should return 409 if the email already exists', async () => {
      const existingUser = await userEntityFactory({
        dataSource,
      });
      const createUserDto: CreateUserDto = userDtoFactory({
        userData: {
          email: existingUser.email,
        },
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
      const existingUser = await userEntityFactory({
        dataSource,
      });
      const createUserDto: CreateUserDto = userDtoFactory({
        userData: {
          username: existingUser.username,
        },
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
  });

  describe(`GET /users/:id`, () => {
    it(`should return a user by id`, async () => {
      const user = await userEntityFactory({
        dataSource,
      });

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
      const user = await userEntityFactory({
        dataSource,
      });

      const profile = await profileEntityFactory({
        dataSource,
        user,
      });

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

  // it(`/PATCH users/:id/profile`, async () => {
  //   const result = await app.inject({
  //     method: 'PATCH',
  //     url: `/users/${expectedUser.id}/profile`,
  //     payload: {
  //       bio: 'Test bio',
  //     },
  //   });

  //   const parsedPayload = JSON.parse(result.payload) as Profile;

  //   expect(result.statusCode).toEqual(200);
  //   expect(parsedPayload.bio).toEqual('Test bio');
  // });
});
