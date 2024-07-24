import { Module } from '@nestjs/common';
import { BlockedUsersService } from './blocked-users.service';
import { BlockedUsersController } from './blocked-users.controller';

@Module({
  controllers: [BlockedUsersController],
  providers: [BlockedUsersService],
})
export class BlockedUsersModule {}
