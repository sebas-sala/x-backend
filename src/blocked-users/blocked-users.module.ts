import { Module } from '@nestjs/common';
import { BlockedUsersService } from './blocked-users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser } from './entities/blocked-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedUser])],
  controllers: [],
  providers: [BlockedUsersService],
  exports: [BlockedUsersService],
})
export class BlockedUsersModule {}
