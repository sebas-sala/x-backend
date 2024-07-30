import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { User } from '@/src/users/entities/user.entity';
import { UsersService } from '@/src/users/users.service';
import { CreateUserDto } from '@/src/users/dto/create-user.dto';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesModule } from '@/src/profiles/profiles.module';

import { Post } from '@/src/posts/entities/post.entity';

import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';
import { createMockQueryRunner } from '@/tests/utils/mocks/query-runner.mock';

const mockUser: User = {
  id: '1',
  name: 'Pedrito',
  email: 'pedrito@gmail.com',
  username: 'pedrito',
  password: '123456',
  profile: undefined as any,
  posts: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: Repository<User>;
  let queryRunner: any;

  beforeEach(async () => {
    queryRunner = createMockQueryRunner();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProfilesModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Profile, Post],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
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
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create()', () => {
    const createUserDto: CreateUserDto = {
      name: 'Pedrito',
      email: 'pedrito@gmail.com',
      username: 'pedrito',
      password: '123456',
    };

    it('should save a user', async () => {
      const { manager } = queryRunner;

      jest.spyOn(manager, 'create').mockResolvedValue(mockUser);

      const result = await usersService.create(createUserDto);

      expect(result).toEqual({
        ...mockUser,
        id: expect.any(String),
        password: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(manager.create).toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalled();
      expect(manager.findOne).toHaveBeenCalledWith(User, {
        where: [{ username: mockUser.username }, { email: mockUser.email }],
      });
    });

    it('should handle ConflictException when username already exists', async () => {
      const { manager } = queryRunner;

      jest.spyOn(manager, 'findOne').mockResolvedValue(mockUser);

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'Username already exists',
      );
    });

    it('should handle ConflictException when email already exists', async () => {
      const { manager } = queryRunner;

      jest.spyOn(manager, 'findOne').mockResolvedValue({
        ...mockUser,
        username: 'aoierstnoart',
      });

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      jest.spyOn(usersRepository, 'find').mockResolvedValue([mockUser]);

      const result = await usersService.findAll();
      expect(result).toEqual([mockUser]);
    });

    it('should return an empty array if no users exist', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValue([]);

      const result = await usersService.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('should return a user by id', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await usersService.findOneById(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return a user by username', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await usersService.findByUsername(mockUser.username);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the user does not exist by id', async () => {
      await expect(usersService.findOneById('999')).rejects.toThrow(
        'User not found',
      );
      await expect(usersService.findOneById('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if the user does not exist by username', async () => {
      await expect(usersService.findByUsername('user1')).rejects.toThrow(
        'User not found',
      );
      await expect(usersService.findByUsername('user1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
