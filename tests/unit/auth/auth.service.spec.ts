import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from '@/src/auth/auth.service';

import { User } from '@/src/users/entities/user.entity';
import { UsersModule } from '@/src/users/users.module';
import { UsersService } from '@/src/users/users.service';

import { Profile } from '@/src/profiles/entities/profile.entity';

import { Post } from '@/src/posts/entities/post.entity';

import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';
import { createMockQueryRunner } from '@/src/common/tests/mocks/query-runner.mock';

const mockUser: User = {
  id: '1',
  name: 'Pedrito',
  email: 'test@gmail.com',
  username: 'test',
  password: '123456',
  profile: undefined as any,
  posts: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let usersRepository: Repository<User>;
  let queryRunner: any;

  beforeEach(async () => {
    queryRunner = createMockQueryRunner();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        ConfigModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Profile, Post],
          synchronize: true,
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('jwtSecret'),
            signOptions: { expiresIn: '7d' },
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([User]),
        UsersModule,
      ],
      providers: [
        AuthService,
        UsersService,
        {
          provide: QueryRunnerFactory,
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('login()', () => {
    it('should return an access token', async () => {
      const token = await authService.login(mockUser);

      console.log(token);

      expect(token).toEqual({ access_token: 'token' });
    });
  });

  describe('validateUser()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return a user if the credentials are valid', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);

      const user = await authService.validateUser(
        mockUser.username,
        mockUser.password,
      );

      const { password, ...result } = mockUser;

      expect(user).toEqual(result);
    });
  });

  it('should return NotFoundError if the user does not exist', async () => {
    await expect(
      authService.validateUser(mockUser.username, mockUser.password),
    ).rejects.toThrow(NotFoundException);

    await expect(
      authService.validateUser(mockUser.username, mockUser.password),
    ).rejects.toThrow('User not found');
  });

  it('should return NotFoundError if the password is invalid', async () => {
    jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);

    await expect(
      authService.validateUser(mockUser.username, mockUser.password),
    ).resolves.toBeNull();
  });
});
