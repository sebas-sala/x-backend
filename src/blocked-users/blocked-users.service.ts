import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, ConflictException } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { BlockedUser } from './entities/blocked-user.entity';

import { UsersService } from '../users/users.service';

@Injectable()
export class BlockedUsersService {
  constructor(
    @InjectRepository(BlockedUser)
    private readonly blockedUsersRepository: Repository<BlockedUser>,

    private readonly usersService: UsersService,
  ) {}

  async blockUser(
    blockedUserId: string,
    blockingUser: User,
  ): Promise<BlockedUser> {
    await this.validateBlockedUserExists(blockedUserId);
    await this.validateBlockDoesNotExist(blockingUser.id, blockedUserId);

    const blockedUser = this.blockedUsersRepository.create({
      blockingUser,
      blockedUser: { id: blockedUserId },
    });

    return await this.blockedUsersRepository.save(blockedUser);
  }

  async unblockUser(
    blockedUserId: string,
    blockingUser: User,
  ): Promise<number | null | undefined> {
    await this.validateBlockedUserExists(blockedUserId);

    const result = await this.blockedUsersRepository.delete({
      blockingUser,
      blockedUser: { id: blockedUserId },
    });

    return result.affected;
  }

  async getBlockedUsers(user: User): Promise<BlockedUser[]> {
    const blockedUsers = await this.blockedUsersRepository.find({
      where: {
        blockingUser: { id: user.id },
      },
      relations: ['blockedUser', 'blockedUser.profile'],
    });

    return blockedUsers;
  }

  private async validateBlockedUserExists(
    blockedUserId: string,
  ): Promise<void> {
    await this.usersService.findOneByIdOrFail(
      blockedUserId,
      `Blocked user not found`,
    );
  }

  private async validateBlockDoesNotExist(
    blockingUserId: string,
    blockedUserId: string,
  ): Promise<void> {
    if (blockingUserId === blockedUserId) {
      throw new ConflictException('User cannot block themselves');
    }

    const block = await this.blockedUsersRepository.findOne({
      where: {
        blockingUser: { id: blockingUserId },
        blockedUser: { id: blockedUserId },
      },
    });

    if (block) {
      throw new ConflictException('User already blocked');
    }
  }
}
