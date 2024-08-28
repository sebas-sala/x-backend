import { DataSource } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';

type CreateBlockedUserDto = {
  blockingUserId: string;
  blockedUserId: string;
};

export default class BlockedUserFactory {
  constructor(private readonly dataSource?: DataSource) {}

  async createBlockedUser({
    blockingUserId,
    blockedUserId,
  }: Partial<CreateBlockedUserDto> = {}): Promise<BlockedUser> {
    if (!this.dataSource)
      throw new Error('DataSource is required to create a Follow entity.');

    if (!blockingUserId)
      throw new Error(
        'Blocking user ID is required to create a Blocked User entity.',
      );

    if (!blockedUserId)
      throw new Error(
        'Blocked user ID is required to create a Blocked User entity.',
      );

    try {
      const usersRepository = this.dataSource.getRepository(User);
      const blockedUsersRepository = this.dataSource.getRepository(BlockedUser);

      const blockingUser = await usersRepository.findOneBy({
        id: blockingUserId,
      });
      const blockedUser = await usersRepository.findOneBy({
        id: blockedUserId,
      });

      if (!blockingUser || !blockedUser) {
        throw new Error('One or both users do not exist.');
      }

      const createBlockedUserDto = blockedUsersRepository.create({
        blockingUser: blockingUser,
        blockedUser: blockedUser,
      });

      return await blockedUsersRepository.save(createBlockedUserDto);
    } catch (error) {
      throw error;
    }
  }
}
