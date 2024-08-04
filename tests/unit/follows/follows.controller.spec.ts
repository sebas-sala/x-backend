import { Test, TestingModule } from '@nestjs/testing';
import { FollowController } from '../../../src/follows/follows.controller';
import { FollowService } from '../../../src/follows/follows.service';

describe('FollowController', () => {
  let controller: FollowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [FollowService],
    }).compile();

    controller = module.get<FollowController>(FollowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
