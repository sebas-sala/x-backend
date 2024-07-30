import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';

import { User } from '@/src/users/entities/user.entity';
import { UsersModule } from '@/src/users/users.module';

import { Post } from '@/src/posts/entities/post.entity';

import { Profile } from '@/src/profiles/entities/profile.entity';

import { createTestUser } from '@/src/common/tests/factories/user.factory';
import { createTestProfile } from '@/src/common/tests/factories/profile.factory';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;
  let user: User;
  let expectedUser: any;

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

    const usersRepository = app.get('UserRepository');
    const profilesRepository = app.get('ProfileRepository');

    // MOCK DATA
    expectedUser = await createTestUser({ userRepository: usersRepository });
    await createTestProfile({
      profileRepository: profilesRepository,
      user: expectedUser,
    });

    expectedUser = plainToInstance(User, expectedUser, {
      groups: ['public'],
    });

    expectedUser.createdAt = (expectedUser.createdAt as Date).toISOString();
    expectedUser.updatedAt = (expectedUser.updatedAt as Date).toISOString();

    expectedUser = instanceToPlain(expectedUser, { groups: ['public'] });
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it(`/GET users`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/users',
    });

    const parsedPayload = JSON.parse(result.payload) as User[];

    expect(result.statusCode).toEqual(200);
    expect(parsedPayload.length).toEqual(1);
    expect(parsedPayload[0]).toMatchObject(expectedUser);
  });

  it(`/GET users/:id`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: `/users/${expectedUser.id}`,
    });

    const parsedPayload = JSON.parse(result.payload) as User;

    expect(result.statusCode).toEqual(200);
    expect(parsedPayload).toMatchObject(expectedUser);
  });

  it(`/GET users/:id (404 not found)`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/users/2',
    });

    const parsedPayload = JSON.parse(result.payload);

    const expectedResponse = {
      statusCode: 404,
      message: 'User not found',
      error: 'Not Found',
    };

    expect(result.statusCode).toEqual(404);
    expect(result.statusCode).toEqual(expectedResponse.statusCode);
    expect(parsedPayload.message).toEqual(expectedResponse.message);
    expect(parsedPayload.error).toEqual(expectedResponse.error);
  });

  it(`/GET users/:id/profile`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: `/users/${expectedUser.id}/profile`,
    });

    const parsedPayload = JSON.parse(result.payload) as User;

    expect(result.statusCode).toEqual(200);
    expect(parsedPayload).toMatchObject(expectedUser);
  });

  it(`/GET users/:id/profile (404 not found)`, async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/users/2/profile',
    });

    const parsedPayload = JSON.parse(result.payload);

    const expectedResponse = {
      statusCode: 404,
      message: 'User not found',
      error: 'Not Found',
    };

    expect(result.statusCode).toEqual(404);
    expect(result.statusCode).toEqual(expectedResponse.statusCode);
    expect(parsedPayload.message).toEqual(expectedResponse.message);
    expect(parsedPayload.error).toEqual(expectedResponse.error);
  });

  it(`/PATCH users/:id/profile`, async () => {
    const result = await app.inject({
      method: 'PATCH',
      url: `/users/${expectedUser.id}/profile`,
      payload: {
        bio: 'Test bio',
      },
    });

    const parsedPayload = JSON.parse(result.payload) as Profile;

    expect(result.statusCode).toEqual(200);
    expect(parsedPayload.bio).toEqual('Test bio');
  });

  afterAll(async () => {
    await app.close();
  });
});
