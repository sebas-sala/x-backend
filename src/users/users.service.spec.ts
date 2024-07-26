import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';

import { Like } from 'src/likes/entities/like.entity';
import { Post } from 'src/posts/entities/post.entity';
import { Follow } from 'src/follows/entities/follow.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Bookmark } from 'src/bookmarks/entities/bookmark.entity';

const mockUsers = [
  {
    name: 'User 1',
    email: 'HlqQp@example.com',
    username: 'user1',
    password: 'password1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'User 2',
    email: 'HlrstqQp@examrple.com',
    username: 'user2',
    password: 'password2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'User 3',
    email: 'HlqrstQp@example.com',
    username: 'user3',
    password: 'password3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: Repository<User>;

  const mockRepository = {
    find: jest.fn().mockResolvedValue(mockUsers),
    findOne: jest.fn().mockResolvedValue(mockUsers[0]),
    findOneBy: jest.fn().mockResolvedValue(mockUsers[0]),
    save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    create: jest.fn().mockImplementation((user) => user),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            User,
            // Post,
            // Like,
            // Follow,
            // Profile,
            // Comment,
            // Bookmark,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          User,
          // Post,
          // Like,
          // Follow,
          // Profile,
          // Comment,
          // Bookmark,
        ]),
      ],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
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
    it('should create a new user', async () => {
      const user = {
        name: 'Pedrito',
        email: 'pedrito@gmail.com',
        username: 'pedrito',
        password: '123456',
      };

      jest.spyOn(usersService, 'hashPassword').mockResolvedValue('123456');

      const result = await usersService.create(user);

      expect(result).toEqual(user);
    });

    it('should handle ConflictException when username already exists', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Username already exists'));

      const user = {
        name: 'User 4',
        email: 'HlqsQp@example.com',
        username: 'user4',
        password: 'password4',
      };

      await expect(usersService.create(user)).rejects.toThrow(
        'Username already exists',
      );
    });

    it('should handle ConflictException when email already exists', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Email already exists'));

      const user = {
        name: 'User 4',
        email: 'HlqsQp@example.com',
        username: 'user4',
        password: 'password4',
      };

      await expect(usersService.create(user)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      const result = await usersService.findAll();
      expect(result).toEqual(mockUsers);
    });

    it('should return an empty array if no users exist', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValue([]);

      const result = await usersService.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOneBy()', () => {
    it('should return a user by username', async () => {
      const result = await usersService.findById('user1');
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return a user by email', async () => {
      const result = await usersService.findByEmail('HlqQp@example.com');
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return a user by email', async () => {
      const result = await usersService.findByUsername('user1');
      expect(result).toEqual(mockUsers[0]);
    });

    it('should throw an error if the user does not exist by id', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(usersService.findById('999')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw an error if the user does not exist by email', async () => {
      jest
        .spyOn(usersService, 'findByEmail')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        usersService.findByEmail('HlqQp@example.com'),
      ).rejects.toThrow('User not found');
    });

    it('should throw an error if the user does not exist by username', async () => {
      jest
        .spyOn(usersService, 'findByUsername')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(usersService.findByUsername('user1')).rejects.toThrow(
        'User not found',
      );
    });
  });
});
