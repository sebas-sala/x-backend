import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, ConflictException } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { BlockedUser } from './entities/blocked-user.entity';

import { UsersService } from '../users/users.service';
import { PaginationDto } from '../common/dto/pagination.dto';

import {
  type PaginatedResult,
  PaginationService,
} from '../common/services/pagination.service';

@Injectable()
export class BlockedUsersService {
  constructor(
    @InjectRepository(BlockedUser)
    private readonly blockedUsersRepository: Repository<BlockedUser>,

    private readonly usersService: UsersService,
    private readonly paginationService: PaginationService,
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

  async getBlockedUsers({
    user,
    paginationDto,
  }: {
    user: User;
    paginationDto: PaginationDto;
  }): Promise<PaginatedResult<BlockedUser>> {
    const query = this.blockedUsersRepository
      .createQueryBuilder('blockedUser')
      .leftJoinAndSelect('blockedUser.blockedUser', 'user')
      .where('blockedUser.blockingUserId = :userId', {
        userId: user.id,
      });

    const paginatedResult = await this.paginationService.paginate<BlockedUser>({
      query,
      ...paginationDto,
    });

    paginatedResult.data = paginatedResult.data.map((blockedUser) => {
      return blockedUser.blockedUser as unknown as BlockedUser;
    });

    return paginatedResult;
  }

  private async validateBlockedUserExists(
    blockedUserId: string,
  ): Promise<void> {
    await this.usersService.findOneByIdOrFail({
      id: blockedUserId,
      error: `Blocked user not found`,
    });
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
