import { AddressInfo } from 'ws';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';
import { Notification } from '@/src/notifications/entities/notification.entity';

import { setupTestApp } from '../utils/setup-test-app';
import {
  ChatFactory,
  MessageFactory,
  UserFactory,
} from '@/tests/utils/factories';

describe('Notifications API (e2e)', () => {
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

    const server = app.getHttpServer();
    const address = server.address() as AddressInfo;
    port = address.port;

    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    chatFactory = setup.chatFactory;
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

    token = jwtService.sign({
      userId: currentUser.id,
      username: currentUser.username,
    });

    socket = io(`http://localhost:${port}/notifications`, {
      reconnection: false,
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('Connection', () => {
    it('should connect to the websocket server', () => {
      expect(socket.connected).toBeTruthy();
    });

    it('should disconnect from the websocket server', async () => {
      socket.disconnect();
      expect(socket.connected).toBeFalsy();
    });
  });

  describe('message', () => {
    it('should send a message to the server', (done) => {
      (async () => {
        const mockUser = await userFactory.createUserEntity();
        const chat = await chatFactory.createChatEntity({
          name: 'Test chat',
          users: [currentUser.id, mockUser.id],
        });
        const messageDto = MessageFactory.createMessageDto({
          chatId: chat.id,
          content: 'Hello, world!',
        });

        socket.emit('message', { ...messageDto }, async (res: any) => {
          expect(res.success).toBeTruthy();

          expect(res.data).toMatchObject({
            user: {
              id: currentUser.id,
            },
            content: 'Hello, world!',
            chat: {
              id: chat.id,
            },
          });
          done();
        });
      })();
    });

    it('should not create notification if chat does not have users', (done) => {
      (async () => {
        const chat = await chatFactory.createChatEntity({
          name: 'Test chat',
          users: [],
        });
        const messageDto = MessageFactory.createMessageDto({
          chatId: chat.id,
          content: 'Hello, world!',
        });

        socket.emit('message', { ...messageDto }, async (res: any) => {
          expect(res.success).toBeTruthy();

          expect(await dataSource.getRepository(Notification).find()).toEqual(
            [],
          );
          done();
        });
      })();
    });

    it('should throw 404 error if chat does not exist', (done) => {
      (async () => {
        const messageDto = MessageFactory.createMessageDto({
          chatId: 'invalid-id',
          content: 'Hello, world!',
        });

        socket.emit('message', { ...messageDto });

        socket.on('error', (error) => {
          expect(error.success).toBeFalsy();
          expect(error.data).toMatchObject({
            statusCode: 404,
            message: 'Chat not found',
          });
          done();
        });
      })();
    });

    //   it('should throw 404 error if receiver does not exist', async () => {
    //     const messageDto = MessageFactory.createMessageDto('invalid-id');

    //     await new Promise((resolve, reject) => {
    //       socket.emit('createMessage', { ...messageDto }, (res: any) => {
    //         try {
    //           expect(res).toMatchObject({
    //             status: 404,
    //             message: 'User with id invalid-id not found',
    //           });
    //           resolve(true);
    //         } catch (error) {
    //           reject(error);
    //         }
    //       });
    //     });
    //   });
  });
});
