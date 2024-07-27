import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockUser = {
  id: '1',
  name: 'Pedrito',
  email: 'pedrito@gmail.com',
  username: 'pedrito',
  password: '123456',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
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

    const savedUser = {
      ...createUserDto,
      id: mockUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should save a user', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockReturnValue(savedUser);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(savedUser);

      const result = await usersService.create(createUserDto);

      expect(result).toEqual({
        ...mockUser,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [
          {
            username: createUserDto.username,
          },
          {
            email: createUserDto.email,
          },
        ],
      });
      expect(usersRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(usersRepository.save).toHaveBeenCalledWith(savedUser);
    });

    it('should handle ConflictException when username already exists', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue({
        ...mockUser,
        email: 'anotherEmail@gmail.com',
      });

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );
    });

    it('should handle ConflictException when email already exists', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValueOnce({
        ...mockUser,
        username: 'anotherUsername',
      });

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
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

  describe('findOneBy()', () => {
    beforeEach(() => {
      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValue(mockUser);
    });

    it('should return a user by username', async () => {
      const result = await usersService.findById('user1');
      expect(result).toEqual(mockUser);
    });

    it('should return a user by email', async () => {
      const result = await usersService.findByEmail('HlqQp@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return a user by email', async () => {
      const result = await usersService.findByUsername('user1');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the user does not exist by id', async () => {
      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValue(null);

      await expect(usersService.findById('999')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should throw an error if the user does not exist by email', async () => {
      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValueOnce(null);

      await expect(
        usersService.findByEmail('HlqQp@example.com'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should throw an error if the user does not exist by username', async () => {
      jest.spyOn(usersRepository, 'findOneBy').mockResolvedValueOnce(null);

      await expect(usersService.findByUsername('user1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
