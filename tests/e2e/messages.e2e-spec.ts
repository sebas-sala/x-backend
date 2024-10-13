import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { User } from '@/src/users/entities/user.entity';

import {
  UserFactory,
  ChatFactory,
  MessageFactory,
  BlockedUserFactory,
} from '../utils/factories';

import { setupTestApp } from '../utils/setup-test-app';
import { Notification } from '@/src/notifications/entities/notification.entity';

describe('Messages API (e2e)', () => {
  let app: NestFastifyApplication;

  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;

  let currentUser: User;

  let userFactory: UserFactory;
  let chatFactory: ChatFactory;
  let blockedUserFactory: BlockedUserFactory;

  beforeAll(async () => {
    const setup = await setupTestApp();

    app = setup.app;
    dataSource = setup.dataSource;
    jwtService = setup.jwtService;

    userFactory = setup.userFactory;
    chatFactory = setup.chatFactory;
    blockedUserFactory = setup.blockedUserFactory;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    currentUser = await userFactory.createUserEntity();

    token = jwtService.sign({ sub: currentUser.id });
  });

  describe('POST /comments', () => {
    it('should create a comment', async () => {
      const mockUser = await userFactory.createUserEntity();
      const chat = await chatFactory.createChatEntity({
        name: 'Test chat',
        users: [currentUser.id, mockUser.id],
      });
      const messageDto = MessageFactory.createMessageDto({
        chatId: chat.id,
        content: 'Hello, world!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/messages',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: messageDto,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toMatchObject({
        success: true,
        data: {
          content: messageDto.content,
          chat: {
            id: chat.id,
          },
          user: {
            id: currentUser.id,
          },
        },
      });
      expect(await dataSource.getRepository(Notification).find()).toHaveLength(
        1,
      );
    });

    it('should not create a notification if there are no users in the chat', async () => {
      const chat = await chatFactory.createChatEntity({
        name: 'Test chat',
        users: [currentUser.id],
      });
      const messageDto = MessageFactory.createMessageDto({
        chatId: chat.id,
        content: 'Hello, world!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/messages',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: messageDto,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toMatchObject({
        success: true,
        data: {
          content: messageDto.content,
          chat: {
            id: chat.id,
          },
          user: {
            id: currentUser.id,
          },
        },
      });
      expect(await dataSource.getRepository(Notification).find()).toHaveLength(
        0,
      );
    });

    it('should throw 401 if user is not authenticated', async () => {
      const messageDto = MessageFactory.createMessageDto({
        chatId: 'invalid-id',
        content: 'Hello, world!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/messages',
        payload: messageDto,
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toMatchObject({
        status: 401,
        message: 'Unauthorized',
      });
    });

    it('should throw 403 if user is not a member of the chat', async () => {
      const mockUser = await userFactory.createUserEntity();
      const chat = await chatFactory.createChatEntity({
        name: 'Test chat',
        users: [mockUser.id],
      });
      const messageDto = MessageFactory.createMessageDto({
        chatId: chat.id,
        content: 'Hello, world!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/messages',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: messageDto,
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.payload)).toMatchObject({
        status: 403,
        message: 'You are not a member of this chat',
      });
    });

    it('should throw 404 if chat does not exist', async () => {
      const messageDto = MessageFactory.createMessageDto({
        chatId: 'invalid-id',
        content: 'Hello, world!',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/messages',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        payload: messageDto,
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toMatchObject({
        status: 404,
        message: 'Chat not found',
      });
    });
  });
});
