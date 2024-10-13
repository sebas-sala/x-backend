import { DataSource } from 'typeorm';
import { ConflictException, Injectable } from '@nestjs/common';

import { User } from '@/src/users/entities/user.entity';

@Injectable()
export class BlockService {
  constructor(private readonly dataSource: DataSource) {}

  async isBlocked(users: User[], currentUser: User): Promise<boolean> {
    const usersIds = users.map((user) => user.id);

    const result = await this.dataSource
      .createQueryBuilder()
      .select('1')
      .from('blocked_user', 'blocked_user')
      .where('blockingUserId = :currentUserId', {
        currentUserId: currentUser.id,
      })
      .andWhere('blockedUserId IN (:...usersIds)', { usersIds })
      .orWhere('blockingUserId IN (:...usersIds)', { usersIds })
      .andWhere('blockedUserId = :currentUserId', {
        currentUserId: currentUser.id,
      })
      .getRawOne();

    return !!result;
  }

  async validateIsBlocked(
    users: User[],
    currentUser: User,
    error?: string,
  ): Promise<void> {
    const isBlocked = await this.isBlocked(users, currentUser);

    if (isBlocked) {
      throw new ConflictException(error || 'User is blocked');
    }
  }
}
