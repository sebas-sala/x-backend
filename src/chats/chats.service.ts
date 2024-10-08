import { InjectRepository } from '@nestjs/typeorm';
import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Chat } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';

import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';

import { CreateChatDto } from './dto/create-chat.dto';

import { CreateChat } from './types/create-chat';
import { SetChatUsers } from './types/set-chat-users';
import { CreateChatMessage } from './types/create-chat-message';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,

    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createChatDto: CreateChatDto, currentUser: User) {
    const users = await this.setChatUsers({
      usersIds: createChatDto.users,
      currentUser,
    });

    await this.validateChatDoesNotExist(users, createChatDto.isChatGroup);

    const { isChatGroup, message: content, name } = createChatDto;

    return await this.dataSource.transaction(async (manager) => {
      const chat = await this.createChat({
        name,
        users,
        isChatGroup,
        manager,
      });

      await this.createChatMessage({
        chatId: chat.id,
        content: content,
        sender: currentUser,
        manager,
      });

      return chat;
    });
  }

  private async createChat({ users, name, isChatGroup, manager }: CreateChat) {
    const chatRepository = this.setChatRepository(manager);

    const chat = chatRepository.create({
      name,
      users,
      isChatGroup,
    });
    return await chatRepository.save(chat);
  }

  private async createChatMessage({
    chatId,
    content,
    sender,
    manager,
  }: CreateChatMessage) {
    if (!content) return;

    return await this.messagesService.create(
      {
        chatId,
        content,
      },
      sender,
      manager,
    );
  }

  private async setChatUsers({ usersIds, currentUser }: SetChatUsers) {
    const users = await this.usersService.findByIds(usersIds);

    if (!users.some((user) => user.id === currentUser.id)) {
      users.push(currentUser);
    }

    return users;
  }

  private setChatRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(Chat) : this.chatRepository;
  }

  private async validateChatDoesNotExist(users: User[], isChatGroup = false) {
    if (isChatGroup) return;

    const usersIds = users.map((user) => user.id);

    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoin('chat.users', 'users')
      .where('chat.isChatGroup = :isChatGroup', { isChatGroup })
      .andWhere('users.id IN (:...users)', { users: usersIds })
      .getOne();

    if (chat) {
      throw new ConflictException('Chat already exists');
    }
  }
}
