import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from '../../../src/follows/follows.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '@/src/follows/entities/follow.entity';
import UserFactory from '@/tests/utils/factories/user.factory';
import FollowFactory from '@/tests/utils/factories/follow.factory';

import { User } from '@/src/users/entities/user.entity';
import QueryBuilderMock from '@/tests/utils/mocks/query-builder.mock';
import { UsersModule } from '@/src/users/users.module';
import { UsersService } from '@/src/users/users.service';
import { NotFoundException } from '@nestjs/common';

describe('FollowService', () => {
  let service: FollowService;
  let usersService: UsersService;

  const followRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(new QueryBuilderMock()),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Follow]),
      ],
      providers: [
        FollowService,
        {
          provide: getRepositoryToken(Follow),
          useValue: followRepository,
        },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create()', () => {
    it('should create a new follow', async () => {
      const createFollowDto = FollowFactory.createFollowDto();
      const mockFollowedUser = UserFactory.createUserData();
      const mockFollowerUser = UserFactory.createUserData();

      jest
        .spyOn(usersService, 'findOneBy')
        .mockResolvedValueOnce(mockFollowedUser as User);
      jest
        .spyOn(usersService, 'findOneBy')
        .mockResolvedValueOnce(mockFollowerUser as User);

      followRepository.createQueryBuilder.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(undefined),
      });
      followRepository.create.mockReturnValue(createFollowDto);
      followRepository.save.mockResolvedValue(createFollowDto);

      const result = await service.create(createFollowDto);

      expect(followRepository.create).toHaveBeenCalledWith({
        follower: mockFollowedUser,
        following: mockFollowerUser,
      });
      expect(followRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createFollowDto);
    });

    it('should throw an error if follow already exists', async () => {
      const createFollowDto = FollowFactory.createFollowDto();
      const mockFollowedUser = UserFactory.createUserData();
      const mockFollowerUser = UserFactory.createUserData();

      jest
        .spyOn(usersService, 'findOneBy')
        .mockResolvedValueOnce(mockFollowedUser as User);
      jest
        .spyOn(usersService, 'findOneBy')
        .mockResolvedValueOnce(mockFollowerUser as User);

      followRepository.createQueryBuilder.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(FollowFactory.createFollowDto()),
      });

      await expect(service.create(createFollowDto)).rejects.toThrow(
        'Follow already exists',
      );
    });

    it('should throw an error if follower does not exist', async () => {
      const createFollowDto = FollowFactory.createFollowDto();

      jest
        .spyOn(usersService, 'findOneBy')
        .mockRejectedValue(new NotFoundException('Follower not found'));

      await expect(service.create(createFollowDto)).rejects.toThrow(
        'Follower not found',
      );
      await expect(service.create(createFollowDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if following does not exist', async () => {
      const createFollowDto = FollowFactory.createFollowDto();
      const mockFollowerUser = UserFactory.createUserData();

      jest
        .spyOn(usersService, 'findOneBy')
        .mockResolvedValueOnce(mockFollowerUser as User);
      jest
        .spyOn(usersService, 'findOneBy')
        .mockRejectedValue(new NotFoundException('Following not found'));

      await expect(service.create(createFollowDto)).rejects.toThrow(
        'Following not found',
      );
      await expect(service.create(createFollowDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove()', () => {
    it('should remove a follow', async () => {
      const deleteFollowDto = FollowFactory.deleteFollowDto();
      const mockFollow = FollowFactory.createFollowDto();

      followRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(mockFollow),
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce({ affected: 1 }),
      });

      const result = await service.remove(deleteFollowDto);

      expect(followRepository.createQueryBuilder).toHaveBeenCalled();
      expect(followRepository.createQueryBuilder().delete).toHaveBeenCalled();
      expect(result).toEqual(1);
    });

    it('should throw an error if follow does not exist', async () => {
      const deleteFollowDto = FollowFactory.deleteFollowDto();

      followRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(undefined),
      });

      await expect(service.remove(deleteFollowDto)).rejects.toThrow(
        'Follow not found',
      );
      await expect(service.remove(deleteFollowDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
