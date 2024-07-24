import { Test, TestingModule } from '@nestjs/testing';
import { BlockedUsersService } from './blocked-users.service';

describe('BlockedUsersService', () => {
  let service: BlockedUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockedUsersService],
    }).compile();

    service = module.get<BlockedUsersService>(BlockedUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
