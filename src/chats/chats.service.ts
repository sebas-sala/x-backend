import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Chat } from './entities/chat.entity';
import { User } from '../users/entities/user.entity';

import { UsersService } from '../users/users.service';
import { BlockService } from '../common/services/block.service';
import { MessagesService } from '../messages/messages.service';

import { CreateChatDto } from './dto/create-chat.dto';

import { CreateChat } from './types/create-chat';
import { SetChatUsers } from './types/set-chat-users';
import { CreateChatMessage } from './types/create-chat-message';

@Injectable()
export class ChatsService {
  MAX_USERS_IN_CHAT = 5;

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,

    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly blockService: BlockService,

    private readonly dataSource: DataSource,
  ) {}

  async create(createChatDto: CreateChatDto, currentUser: User) {
    if (createChatDto.users.length > this.MAX_USERS_IN_CHAT) {
      throw new ConflictException(
        `Maximum number of users in chat is ${this.MAX_USERS_IN_CHAT}`,
      );
    }

    const users = await this.setChatUsers({
      usersIds: createChatDto.users,
      currentUser,
    });

    await this.validateChatDoesNotExist(users, createChatDto.isChatGroup);
    await this.blockService.validateIsBlocked(users, currentUser);

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

  async findByIdOrFail(id: string) {
    const chat = await this.chatRepository.findOneBy({ id });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
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
