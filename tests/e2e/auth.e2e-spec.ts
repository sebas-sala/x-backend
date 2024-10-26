import { DataSource } from 'typeorm';

import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { UserFactory } from '@/tests/utils/factories';

import { setupTestApp } from '../utils/setup-test-app';

describe('Auth API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;

  let userFactory: UserFactory;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;

    dataSource = setup.dataSource;

    userFactory = setup.userFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  describe('POST /auth/login', () => {
    it(`should return a JWT token`, async () => {
      const password = 'password';
      const user = await userFactory.createUserEntity({
        password,
      });

      const result = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: user.username,
          password: password,
        },
      });

      const payload = JSON.parse(result.payload);
      const data = payload.data;
      expect(result.statusCode).toEqual(200);
      expect(data.access_token).toBeDefined();
    });

    it(`should return a 401 error if the credentials are invalid`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'invalid-username',
          password: 'invalid-password',
        },
      });

      expect(result.statusCode).toEqual(401);
    });

    it(`should return a 401 error if the username is missing`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          password: 'password',
        },
      });

      expect(result.statusCode).toEqual(401);
    });
  });
});
