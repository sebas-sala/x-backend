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
import AuthFactory from '@/tests/utils/factories/auth.factory';
import UserFactory from '@/tests/utils/factories/user.factory';
import { Follow } from '@/src/follows/entities/follow.entity';
import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        ConfigModule,
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
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
        TypeOrmModule.forFeature([User, Profile, Follow]),
      ],
      providers: [
        AuthService,
        QueryRunnerFactory,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('login()', () => {
    it('should return a token', async () => {
      const user = UserFactory.createUserData() as User;

      jest
        .spyOn(authService, 'login')
        .mockResolvedValue({ access_token: 'token' });

      const token = await authService.login(user);
      expect(token).toEqual({ access_token: 'token' });
    });
  });

  describe('validateUser()', () => {
    it('should return a user if the credentials are valid', async () => {
      const mockUser = UserFactory.createUserData() as User;

      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const user = await authService.validateUser(
        mockUser.username,
        mockUser.password,
      );

      const { password, ...result } = mockUser;

      expect(user).toEqual(result);
    });

    it('should return NotFoundError if the user does not exist', async () => {
      const mockUser = UserFactory.createUserData() as User;

      await expect(
        authService.validateUser(mockUser.username, mockUser.password),
      ).rejects.toThrow(NotFoundException);
      await expect(
        authService.validateUser(mockUser.username, mockUser.password),
      ).rejects.toThrow('User not found');
    });

    it('should return NotFoundError if the password is invalid', async () => {
      const mockUser = UserFactory.createUserData() as User;

      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.validateUser(mockUser.username, mockUser.password),
      ).resolves.toBeNull();
    });
  });
});
