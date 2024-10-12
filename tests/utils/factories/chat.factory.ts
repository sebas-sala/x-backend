import { faker } from '@faker-js/faker';
import { DataSource, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { Chat } from '@/src/chats/entities/chat.entity';
import { User } from '@/src/users/entities/user.entity';

import { CreateChatDto } from '@/src/chats/dto/create-chat.dto';

export default class ChatFactory {
  constructor(private readonly dataSource?: DataSource) {}

  static createChatDto({
    users,
    isChatGroup,
    message,
    name,
  }: Partial<CreateChatDto> = {}): CreateChatDto {
    const createChatDto: CreateChatDto = new CreateChatDto({
      users: users || [faker.string.uuid()],
      isChatGroup: isChatGroup || false,
      message: message || faker.lorem.sentence(),
      name: name || faker.lorem.sentence(),
    });

    return createChatDto;
  }

  async createChatEntity({
    users,
    isChatGroup,
    message,
    name,
  }: Partial<CreateChatDto> = {}): Promise<Chat> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a Chat entity.');
    }
    if (!users) {
      throw new Error('Users are required to create a Chat entity');
    }

    const createChatDto = ChatFactory.createChatDto({
      users,
      isChatGroup,
      message,
      name,
    });

    const _users = await this.findUsersByIds(createChatDto.users);

    try {
      const chatRepository = this.dataSource.getRepository(Chat);

      const createdChat = chatRepository.create({
        isChatGroup: createChatDto.isChatGroup,
        name: createChatDto.name,
        users: _users,
      });

      return await chatRepository.save(createdChat);
    } catch (error) {
      throw error;
    }
  }

  private async findUsersByIds(ids: string[]): Promise<User[]> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to find users by IDs.');
    }

    const users = await this.dataSource.getRepository(User).find({
      where: { id: In(ids) },
    });

    if (!users) {
      throw new NotFoundException('Users not found');
    }

    return users;
  }
}
