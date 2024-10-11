import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Message } from './entities/message.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';

import { ChatsService } from '../chats/chats.service';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    private readonly chatsService: ChatsService,

    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    sender: User,
    manager?: EntityManager,
  ) {
    const chat = await this.chatsService.findByIdOrFail(
      createMessageDto.chatId,
    );
    const message = await this.createMessage(
      createMessageDto,
      sender,
      chat,
      manager,
    );

    try {
      const users = chat.users.filter((user) => user.id !== sender.id);
      const usersIds = users.map((user) => user.id);

      await this.notificationsService.create({
        type: 'message',
        sender: sender.id,
        receivers: usersIds,
        message: message.content,
        title: chat.name || users[0].username,
      });
    } catch (error) {
      console.error(error);
    }

    return message;
  }

  private async createMessage(
    createMessageDto: CreateMessageDto,
    user: User,
    chat: Chat,
    manager?: EntityManager,
  ): Promise<Message> {
    const messageRepository = this.setMessageRepository(manager);

    const message = messageRepository.create({
      ...createMessageDto,
      chat,
      user,
    });
    return await messageRepository.save(message);
  }

  private setMessageRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(Message) : this.messageRepository;
  }

  findAll() {
    return `This action returns all messages`;
  }

  findOne(id: string) {
    return `This action returns a #${id} message`;
  }

  update(id: string, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: string) {
    return `This action removes a #${id} message`;
  }
}
