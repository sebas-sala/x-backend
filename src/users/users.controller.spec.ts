import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

const mockUsers = [
  {
    name: 'User 1',
    email: 'HlqQp@example.com',
    username: 'user1',
    password: 'password1',
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'User 2',
    email: 'HlqQp@example.com',
    username: 'user2',
    password: 'password2',
    id: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

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
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValueOnce(mockUsers);
      const result = await usersController.findAll();
      expect(result).toEqual(mockUsers);
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
      jest.spyOn(usersService, 'findById').mockResolvedValueOnce(mockUsers[0]);
      const result = await usersController.findOne('1');
      expect(result).toEqual(mockUsers[0]);
      expect(usersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the user does not exist', async () => {
      jest
        .spyOn(usersService, 'findById')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(usersController.findOne('1')).rejects.toThrow(
        NotFoundException,
      );

      await expect(usersController.findOne('1')).rejects.toThrow(
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
      jest.spyOn(usersService, 'create').mockResolvedValueOnce({
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
        id: '3',
      });
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(usersService.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the username already exists', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Username already exists'));

      await expect(usersController.create(mockUsers[0])).rejects.toThrow(
        ConflictException,
      );

      await expect(usersController.create(mockUsers[0])).rejects.toThrow(
        'Username already exists',
      );
    });

    it('should throw an error if the email already exists', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Email already exists'));

      await expect(usersController.create(mockUsers[0])).rejects.toThrow(
        ConflictException,
      );

      await expect(usersController.create(mockUsers[0])).rejects.toThrow(
        'Email already exists',
      );
    });
  });
});
