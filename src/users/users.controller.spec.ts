import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

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
      providers: [
        UsersService,
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([
              {
                name: 'User 1',
                email: 'HlqQp@example.com',
                username: 'user1',
                password: 'password1',
                id: '1',
              },
              {
                name: 'User 2',
                email: 'HlqQp@example.com',
                username: 'user2',
                password: 'password2',
                id: '2',
              },
            ]),
            findById: jest.fn().mockImplementation((id: string) => {
              if (id === '1') {
                return Promise.resolve({
                  name: 'User 1',
                  email: 'HlqQp@example.com',
                  username: 'user1',
                  id,
                });
              } else {
                return Promise.reject(new NotFoundException('User not found'));
              }
            }),
          },
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('findAll()', () => {
    it('should return an array of users', () => {
      usersController.findAll();
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a user', () => {
      expect(usersController.findOne('1')).resolves.toEqual({
        id: '1',
        name: 'User 1',
        email: 'HlqQp@example.com',
        username: 'user1',
      });

      expect(usersService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the user does not exist', async () => {
      await expect(usersController.findOne('999')).rejects.toThrow(
        'User not found',
      );
    });
  });
});
