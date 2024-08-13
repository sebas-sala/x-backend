import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { User } from '@/src/users/entities/user.entity';
import { UsersService } from '@/src/users/users.service';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesModule } from '@/src/profiles/profiles.module';

import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';
import { createMockQueryRunner } from '@/tests/utils/mocks/query-runner.mock';
import UserFactory from '@/tests/utils/factories/user.factory';
import { Follow } from '@/src/follows/entities/follow.entity';

describe('UsersService', () => {
  let usersService: UsersService;
  const usersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  let queryRunner: any;

  beforeEach(async () => {
    queryRunner = createMockQueryRunner();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProfilesModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Follow]),
      ],
      providers: [
        UsersService,
        QueryRunnerFactory,
        {
          provide: QueryRunnerFactory,
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    // usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create()', () => {
    const createUserDto = UserFactory.createUserDto();
    const mockUser = { id: '1', ...createUserDto };

    it('should save a user', async () => {
      const { manager, connect, startTransaction, commitTransaction, release } =
        queryRunner;

      manager.create.mockReturnValue(mockUser);
      manager.save.mockResolvedValue(mockUser);

      const result = await usersService.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(manager.create).toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalled();

      expect(connect).toHaveBeenCalled();
      expect(release).toHaveBeenCalled();
      expect(startTransaction).toHaveBeenCalled();
      expect(commitTransaction).toHaveBeenCalled();

      expect(manager.findOne).toHaveBeenCalledWith(User, {
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      });
    });

    it('should handle ConflictException when username already exists', async () => {
      const { manager, rollbackTransaction } = queryRunner;

      manager.findOne.mockResolvedValue(mockUser);

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'Username already exists',
      );
      expect(rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle ConflictException when email already exists', async () => {
      const { manager, rollbackTransaction } = queryRunner;

      manager.findOne.mockResolvedValue({
        ...mockUser,
        username: 'aoierstnoart',
      });

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
      expect(rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    const mockUser = UserFactory.createUserData() as User;

    it('should return an array of users', async () => {
      usersRepository.find.mockResolvedValue([mockUser]);

      const result = await usersService.findAll();

      expect(result).toEqual([mockUser]);
      expect(usersRepository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no users exist', async () => {
      usersRepository.find.mockResolvedValue([]);

      const result = await usersService.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    const mockUser = UserFactory.createUserData() as User;

    it('should return a user by id', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findOneById(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return a user by username', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await usersService.findByUsername(mockUser.username);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the user does not exist by id', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);

      await expect(usersService.findOneById('999')).rejects.toThrow(
        'User not found',
      );
      await expect(usersService.findOneById('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if the user does not exist by username', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);

      await expect(usersService.findByUsername('user1')).rejects.toThrow(
        'User not found',
      );
      await expect(usersService.findByUsername('user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFollowers()', () => {
    const mockUser = UserFactory.createUserData() as User;

    it('should return an array of followers', async () => {
      usersRepository.find.mockResolvedValue([mockUser]);

      const result = await usersService.getFollowers(mockUser.id);
      expect(result).toEqual([mockUser]);
    });

    it('should return an empty array if no followers exist', async () => {
      usersRepository.find.mockResolvedValue([]);

      const result = await usersService.getFollowers(mockUser.id);
      expect(result).toEqual([]);
    });
  });

  describe('getFollowing()', () => {
    const mockUser = UserFactory.createUserData() as User;

    it('should return an array of following', async () => {
      usersRepository.find.mockResolvedValue([mockUser]);

      const result = await usersService.getFollowing(mockUser.id);
      expect(result).toEqual([mockUser]);
    });

    it('should return an empty array if no following exist', async () => {
      usersRepository.find.mockResolvedValue([]);

      const result = await usersService.getFollowing(mockUser.id);
      expect(result).toEqual([]);
    });
  });
});
