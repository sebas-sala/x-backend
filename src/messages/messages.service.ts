import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';

import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    sender: User,
    manager?: EntityManager,
  ) {
    const messageRepository = this.setMessageRepository(manager);

    const message = messageRepository.create({
      ...createMessageDto,
      chat: { id: createMessageDto.chatId },
      user: sender,
    });
    return await messageRepository.save(message);
  }

  private setMessageRepository(manager?: EntityManager) {
    return manager ? manager.getRepository(Message) : this.messageRepository;
  }

  private async findUserById(id: string) {
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
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
