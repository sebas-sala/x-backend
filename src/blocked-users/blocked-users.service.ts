import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockedUser } from './entities/blocked-user.entity';
import { EntityManager, Repository, Transaction } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { QueryRunnerFactory } from '../common/factories/query-runner.factory';

@Injectable()
export class BlockedUsersService {
  constructor(
    @InjectRepository(BlockedUser)
    private readonly blockedUsersRepository: Repository<BlockedUser>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly queryRunnerFactory: QueryRunnerFactory,
  ) {}

  async blockUser(
    blockingUserId: string,
    blockedUserId: string,
  ): Promise<BlockedUser> {
    const queryRunner = this.queryRunnerFactory.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const manager = queryRunner.manager;

    try {
      await this.validateUsersExist(blockingUserId, blockedUserId, manager);
      await this.validateBlockDoesNotExist(
        blockingUserId,
        blockedUserId,
        manager,
      );

      const blockedUser = this.blockedUsersRepository.create({
        blockingUser: { id: blockingUserId },
        blockedUser: { id: blockedUserId },
      });

      return await this.blockedUsersRepository.save(blockedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async unblockUser(
    blockingUserId: string,
    blockedUserId: string,
  ): Promise<number | null | undefined> {
    await this.validateUsersExist(blockingUserId, blockedUserId);

    const result = await this.blockedUsersRepository.delete({
      blockingUser: { id: blockingUserId },
      blockedUser: { id: blockedUserId },
    });

    return result.affected;
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

  private async validateUsersExist(
    blockingUserId: string,
    blockedUserId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const [blockingUser, blockedUser] = await Promise.all([
      this.findUserById(blockingUserId, manager),
      this.findUserById(blockedUserId, manager),
    ]);

    if (!blockingUser) {
      throw new NotFoundException(
        `Blocking user with ID ${blockingUserId} not found`,
      );
    }

    if (!blockedUser) {
      throw new NotFoundException(
        `Blocked user with ID ${blockedUserId} not found`,
      );
    }
  }

  private async findUserById(
    userId: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    const userRepo = this.getUserRepository(manager);

    return await userRepo.findOne({ where: { id: userId } });
  }

  private async validateBlockDoesNotExist(
    blockingUserId: string,
    blockedUserId: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (blockingUserId === blockedUserId) {
      throw new ConflictException('User cannot block themselves');
    }

    const blockRepository = this.getBlockedUserRepository(manager);

    const block = await blockRepository.findOne({
      where: {
        blockingUser: { id: blockingUserId },
        blockedUser: { id: blockedUserId },
      },
    });

    if (block) {
      throw new ConflictException('User already blocked');
    }
  }

  private getUserRepository(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.usersRepository;
  }

  private getBlockedUserRepository(
    manager?: EntityManager,
  ): Repository<BlockedUser> {
    return manager
      ? manager.getRepository(BlockedUser)
      : this.blockedUsersRepository;
  }
}
