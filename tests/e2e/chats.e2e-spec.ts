import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';

import { UserFactory } from '@/tests/utils/factories';
import { setupTestApp } from '../utils/setup-test-app';
import { Notification } from '@/src/notifications/entities/notification.entity';
import { io, Socket } from 'socket.io-client';
import ChatFactory from '../utils/factories/chat.factory';
import { Message } from '@/src/messages/entities/message.entity';

describe('Chats API (e2e)', () => {
  let app: NestFastifyApplication;
  let socket: Socket;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let chatFactory: ChatFactory;

  let port: number;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;
    port = setup.currentPort;

    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    chatFactory = setup.chatFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  // afterEach(() => {
  //   socket.disconnect();
  // });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({ sub: currentUser.id });

    // socket = io(`http://localhost:${port}/notifications`, {
    //   reconnection: false,
    //   extraHeaders: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    // await new Promise((resolve, reject) => {
    //   socket.on('connect', () => resolve(true));
    //   socket.on('error', reject);
    // });
  });

  describe('POST /chats', () => {
    it(`should create a chat`, async () => {
      const user = await userFactory.createUserEntity();

      const result = await app.inject({
        method: 'POST',
        url: '/chats',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          users: [user.id],
          message: 'Hello',
        },
      });

      expect(result.statusCode).toEqual(201);
      expect(result.json()).toMatchObject({
        users: expect.arrayContaining([
          expect.objectContaining({ id: user.id }),
        ]),
      });
      expect(await dataSource.getRepository(Message).count()).toEqual(1);
    });

    it(`should create a chat group`, async () => {
      const user = await userFactory.createUserEntity();

      const result = await app.inject({
        method: 'POST',
        url: '/chats',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          users: [user.id],
          isChatGroup: true,
          name: 'Group Chat',
        },
      });

      expect(result.statusCode).toEqual(201);
      expect(result.json()).toMatchObject({
        isChatGroup: true,
        name: 'Group Chat',
        users: expect.arrayContaining([
          expect.objectContaining({ id: user.id }),
        ]),
      });
    });

    it(`should create a chat group even if the users are already in another chat group`, async () => {
      const user = await userFactory.createUserEntity();

      const chat = await chatFactory.createChatEntity({
        users: [currentUser.id, user.id],
        isChatGroup: true,
        name: 'Group Chat',
      });

      const result = await app.inject({
        method: 'POST',
        url: '/chats',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          users: [user.id],
          isChatGroup: true,
          name: 'Group Chat',
        },
      });

      expect(result.statusCode).toEqual(201);
      expect(result.json()).toMatchObject({
        isChatGroup: true,
        name: 'Group Chat',
        users: expect.arrayContaining([
          expect.objectContaining({ id: user.id }),
        ]),
      });
    });

    it(`should throw 401 error if user is not authenticated`, async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/chats',
        payload: {
          users: ['1'],
        },
      });

      expect(result.statusCode).toEqual(401);
    });

    it(`should throw 409 error if chat already exists`, async () => {
      const user = await userFactory.createUserEntity();
      const chat = await chatFactory.createChatEntity({
        users: [currentUser.id, user.id],
      });

      const result = await app.inject({
        method: 'POST',
        url: '/chats',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: {
          users: [user.id],
        },
      });

      expect(result.statusCode).toEqual(409);
      expect(result.json()).toMatchObject({
        status: 409,
        message: 'Chat already exists',
        error: 'ConflictException',
      });
    });
  });
});
