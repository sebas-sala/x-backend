import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { User } from '@/src/users/entities/user.entity';
import { UsersService } from '@/src/users/users.service';
import { UsersController } from '@/src/users/users.controller';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesService } from '@/src/profiles/profiles.service';

import { Post } from '@/src/posts/entities/post.entity';

import UserFactory from '@/tests/utils/factories/user.factory';
import ProfileFactory from '@/tests/utils/factories/profile.factory';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  let profilesService: ProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Profile, Post],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Profile]),
      ],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOneById: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ProfilesService,
          useValue: {
            update: jest.fn(),
            findOneBy: jest.fn(),
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
    expect(usersService).toBeDefined();
    expect(profilesService).toBeDefined();
  });

  describe('findAll()', () => {
    const mockUser = UserFactory.createUserData() as User;

    it('should return an array of users', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValueOnce([mockUser]);

      const result = await usersController.findAll();

      expect(result).toEqual([mockUser]);
      expect(usersService.findAll).toHaveBeenCalled();
    });

    it('should return an empty array if there are no users', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValueOnce([]);

      const result = await usersController.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    const mockUser = UserFactory.createUserData() as User;

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
    const mockUser = UserFactory.createUserData() as User;

    it('should return a user profile', async () => {
      jest
        .spyOn(usersService, 'findByUsername')
        .mockResolvedValueOnce(mockUser);

      const result = await usersController.getProfile('1');

      expect(result).toEqual(mockUser);
      expect(usersService.findByUsername).toHaveBeenCalledWith('1');
    });

    it('should throw an error if the user does not exist', async () => {
      jest
        .spyOn(usersService, 'findByUsername')
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
    const mockUser = UserFactory.createUserData() as User;

    const createUserDto = UserFactory.createUserDto();

    it('should create a user', async () => {
      jest.spyOn(usersService, 'create').mockResolvedValueOnce(mockUser);

      const result = await usersController.create(createUserDto);

      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the username already exists', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Username already exists'));

      await expect(usersController.create(mockUser)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(usersController.create(mockUser)).rejects.toHaveProperty(
        'message',
        'Username already exists',
      );
    });

    it('should throw an error if the email already exists', async () => {
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new ConflictException('Email already exists'));

      await expect(usersController.create(mockUser)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(usersController.create(mockUser)).rejects.toHaveProperty(
        'message',
        'Email already exists',
      );
    });
  });

  describe('updateProfile()', () => {
    const mockProfile = ProfileFactory.createProfileData() as Profile;

    const updateProfileDto = {
      bio: 'New bio',
      birthdate: '2020-01-01',
    };

    it('should update a user profile', async () => {
      jest.spyOn(profilesService, 'update').mockResolvedValueOnce(mockProfile);

      const result = await usersController.updateProfile(
        mockProfile.id,
        updateProfileDto,
      );

      expect(result).toEqual(mockProfile);
      expect(profilesService.update).toHaveBeenCalledWith(
        mockProfile.id,
        updateProfileDto,
      );
    });

    it('should throw an error if the profile does not exist', async () => {
      jest
        .spyOn(profilesService, 'update')
        .mockRejectedValue(new NotFoundException('Profile not found'));

      await expect(
        usersController.updateProfile('1', updateProfileDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        usersController.updateProfile('1', updateProfileDto),
      ).rejects.toThrow('Profile not found');
      expect(profilesService.update).toHaveBeenCalledWith(
        '1',
        updateProfileDto,
      );
    });
  });
});
