import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockedUser } from './entities/blocked-user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BlockedUsersService {
  constructor(
    @InjectRepository(BlockedUser)
    private readonly blockedUsersRepository: Repository<BlockedUser>,
  ) {}

  async blockUser(
    blockingUserId: string,
    blockedUserId: string,
  ): Promise<BlockedUser> {
    const blockedUser = this.blockedUsersRepository.create({
      blockingUser: { id: blockingUserId },
      blockedUser: { id: blockedUserId },
    });

    return await this.blockedUsersRepository.save(blockedUser);
  }

  async unblockUser(
    blockingUserId: string,
    blockedUserId: string,
  ): Promise<void> {
    await this.blockedUsersRepository.delete({
      blockingUser: { id: blockingUserId },
      blockedUser: { id: blockedUserId },
    });
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    const blockedUsers = await this.blockedUsersRepository.find({
      where: {
        blockingUser: { id: userId },
      },
      relations: ['blockedUser', 'blockedUser.profile'],
    });

    return blockedUsers;
  }
}
