import { Module } from '@nestjs/common';
import { FollowService } from './follows.service';
import { FollowController } from './follows.controller';

@Module({
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
