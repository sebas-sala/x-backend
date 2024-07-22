import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const users = [
  {
    name: 'User 1',
    email: 'HlqQp@example.com',
    username: 'user1',
    password: 'password1',
  },
  {
    name: 'User 2',
    email: 'HlqQp@example.com',
    username: 'user2',
    password: 'password2',
  },
  {
    name: 'User 3',
    email: 'HlqQp@example.com',
    username: 'user3',
    password: 'password3',
  },
];

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
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue(users),
            findOne: jest.fn().mockResolvedValue(users[0]),
            findOneBy: jest.fn().mockResolvedValue(users[0]),
            findOneByOrFail: jest.fn().mockResolvedValue(users[0]),
            save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
            create: jest
              .fn()
              .mockImplementation((user) => Promise.resolve(user)),
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
    it('should create a new user', async () => {
      const user = {
        name: 'User 4',
        email: 'HlqsQp@example.com',
        username: 'usser4',
        password: 'password4',
      };
      const result = await usersService.create(user);
      const { password, ...createdUser } = result;

      const { password: _, ...expectedUser } = user;

      expect(createdUser).toEqual(expectedUser);
    });
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      const result = await usersService.findAll();
      expect(result).toEqual(users);
    });
  });

  // describe('findById()', () => {
  //   it('should return a user', async () => {
  //     const result = await usersService.findById('1');
  //     expect(result).toEqual(users[0]);
  //   });

  //   it('should throw an error if the user does not exist', async () => {
  //     await expect(usersService.findById('999')).rejects.toThrow(
  //       'User not found',
  //     );
  //   });
  // });

  describe('findByUsername()', () => {
    it('should return a user', async () => {
      const result = await usersService.findByUsername('user1');
      expect(result).toEqual(users[0]);
    });
  });
});
