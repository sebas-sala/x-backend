import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { CreateMessageDto } from '@/src/messages/dto/create-message.dto';

export default class MessageFactory {
  constructor(private readonly dataSource?: DataSource) {}

  static createMessageDto({
    content,
    chatId,
  }: CreateMessageDto): CreateMessageDto {
    return {
      content: content ?? faker.lorem.sentence(),
      chatId: chatId,
    };
  }

  // async createFollow({
  //   followingId,
  //   followerId,
  // }: Partial<CreateFollowDto> = {}): Promise<Follow> {
  //   if (!this.dataSource) {
  //     throw new Error('DataSource is required to create a Follow entity.');
  //   }

  //   if (!followingId) {
  //     throw new Error('Following ID is required to create a Follow entity.');
  //   }

  //   if (!followerId) {
  //     throw new Error('Follower ID is required to create a Follow entity.');
  //   }

  //   try {
  //     const followsRepository = this.dataSource.getRepository(Follow);

  //     const createFollowDto = followsRepository.create({
  //       follower: { id: followerId },
  //       following: { id: followingId },
  //     });

  //     return await followsRepository.save(createFollowDto);
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
