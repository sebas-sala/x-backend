import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CreateUserDto } from './dto/create-user.dto';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesModule } from '@/src/profiles/profiles.module';
import { ProfilesService } from '@/src/profiles/profiles.service';

import { Post } from '@/src/posts/entities/post.entity';

import { QueryRunnerFactory } from '@/src/dababase/query-runner.factory';
import { createMockQueryRunner } from '@/src/utils/mocks/query-runner.mock';

const mockUser: User = {
  name: 'User 1',
  email: 'HlqQp@example.com',
  username: 'user1',
  password: 'password1',
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  profile: undefined as any,
  posts: [],
};

const mockProfile: Profile = {
  id: '1',
  bio: 'test bio',
  birthdate: new Date(),
  isPublic: false,
  location: 'test location',
  website: 'test website',
  updatedAt: new Date(),
  user: {} as any,
};

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let profilesService: ProfilesService;
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
      controllers: [UsersController],
      providers: [
        UsersService,
        ProfilesService,
        {
          provide: QueryRunnerFactory,
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
        {
          provide: ProfilesService,
          useValue: {
            findOneBy: jest.fn(),
            update: jest
              .fn()
              .mockImplementation(() => Promise.resolve(mockProfile)),
          },
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    profilesService = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValueOnce([mockUser]);
      const result = await usersController.findAll();
      expect(result).toEqual([mockUser]);
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if there are no users', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValueOnce([]);
      const result = await usersController.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('should return a user', async () => {
      jest.spyOn(usersService, 'findOneById').mockResolvedValueOnce(mockUser);
      const result = await usersController.findOne('1');
      expect(result).toEqual(mockUser);
      expect(usersService.findOneById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the user does not exist', async () => {
      jest
        .spyOn(usersService, 'findOneById')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(usersController.findOne('1')).rejects.toThrow(
        NotFoundException,
      );

      await expect(usersController.findOne('1')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getProfile()', () => {
    it('should return a user profile', async () => {
      jest.spyOn(usersService, 'findOneById').mockResolvedValueOnce(mockUser);
      const result = await usersController.getProfile('1');
      expect(result).toEqual(mockUser);
      expect(usersService.findOneById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the user does not exist', async () => {
      jest
        .spyOn(usersService, 'findOneById')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(usersController.getProfile('1')).rejects.toThrow(
        NotFoundException,
      );

      await expect(usersController.getProfile('1')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('create()', () => {
    const createUserDto: CreateUserDto = {
      name: 'User 3',
      email: 'newEmail@gmail.com',
      username: 'user3',
      password: 'password3',
    };

    it('should create a user', async () => {
      const { manager } = queryRunner;

      jest.spyOn(manager, 'create').mockResolvedValueOnce({
        ...createUserDto,
        id: '3',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await usersController.create(createUserDto);

      expect(result).toEqual({
        ...createUserDto,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        password: expect.any(String),
        id: '3',
      });
      expect(manager.create).toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalled();
      expect(manager.findOne).toHaveBeenCalledWith(User, {
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      });
    });

    it('should throw an error if the username already exists', async () => {
      const { manager } = queryRunner;

      jest.spyOn(manager, 'findOne').mockResolvedValue(mockUser);

      await expect(usersController.create(mockUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersController.create(mockUser)).rejects.toThrow(
        'Username already exists',
      );
    });

    it('should throw an error if the email already exists', async () => {
      const { manager } = queryRunner;

      jest.spyOn(manager, 'findOne').mockResolvedValue({
        ...mockUser,
        username: 'aoierstnoart',
      });

      await expect(usersController.create(mockUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersController.create(mockUser)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('updateProfile()', () => {
    it('should update a user profile', async () => {
      const updateProfileDto = {
        bio: 'New bio',
        birthdate: '2020-01-01',
      };

      jest.spyOn(profilesService, 'update').mockResolvedValueOnce(mockProfile);

      const result = await usersController.updateProfile('1', updateProfileDto);
      expect(result).toEqual(mockProfile);
    });
  });
});
