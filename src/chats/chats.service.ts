import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { MessagesService } from '../messages/messages.service';

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
    const users = await this.usersService.findByIds(createChatDto.users);
    users.push(currentUser);

    await this.validateChatDoesNotExist(users, createChatDto.isChatGroup);

    const { isChatGroup, message, name } = createChatDto;

    return await this.dataSource.transaction(async (manager) => {
      // if (message) {
      //   await this.messagesService.create(
      //     { content: message },
      //     currentUser,
      //     manager,
      //   );
      // }

      const chat = manager.create(Chat, {
        name,
        users,
        isChatGroup,
      });
      return await manager.save(chat);
    });
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
