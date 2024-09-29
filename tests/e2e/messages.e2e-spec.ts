import { AddressInfo } from 'ws';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';

import { setupTestApp } from '../utils/setup-test-app';
import { UserFactory, MessageFactory } from '@/tests/utils/factories';

describe('Users API (e2e)', () => {
  let app: NestFastifyApplication;
  let socket: Socket;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let messageFactory: MessageFactory;

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
    messageFactory = setup.messageFactory;
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

    socket = io(`http://localhost:${port}/messages`, {
      reconnection: false,
      transports: ['websocket'],
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('connected');
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        console.log('error with connection');
        reject(error);
      });
    });
  });

  describe('Create Message', () => {
    it('should create a message', async () => {
      const mockUser = await userFactory.createUserEntity();

      const messageDto = MessageFactory.createMessageDto(
        mockUser.id,
        'Hello, world!',
      );

      await new Promise((resolve, reject) => {
        socket.emit('createMessage', { ...messageDto }, (res: any) => {
          try {
            expect(res).toMatchObject({
              sender: {
                id: currentUser.id,
              },
              receiver: {
                id: mockUser.id,
              },
              content: 'Hello, world!',
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
      });
    });

    it('should throw 404 error if receiver does not exist', async () => {
      const messageDto = MessageFactory.createMessageDto('invalid-id');

      await new Promise((resolve, reject) => {
        socket.emit('createMessage', { ...messageDto }, (res: any) => {
          try {
            expect(res).toMatchObject({
              status: 404,
              message: 'User with id invalid-id not found',
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  });
});
