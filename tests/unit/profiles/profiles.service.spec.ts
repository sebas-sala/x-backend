import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesService } from '@/src/profiles/profiles.service';
import { User } from '@/src/users/entities/user.entity';

import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';
import { Post } from '@/src/posts/entities/post.entity';

const mockProfile: Profile = {
  id: '1',
  bio: 'test bio',
  birthdate: new Date(),
  isPublic: false,
  location: 'test location',
  website: 'test website',
  updatedAt: new Date(),
  user: undefined as any,
};

const updateProfileDto: UpdateProfileDto = {
  bio: 'new bio',
  birthdate: new Date().toISOString(),
  isPublic: true,
  location: 'new location',
  website: 'new website',
};

const updatedProfile: Profile = {
  ...mockProfile,
  ...updateProfileDto,
  birthdate: new Date(updateProfileDto.birthdate as string),
};

describe('ProfilesService', () => {
  let profilesService: ProfilesService;
  let profilesRepository: Repository<Profile>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Profile, User, Post],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Profile]),
      ],
      providers: [ProfilesService],
    }).compile();

    profilesService = module.get<ProfilesService>(ProfilesService);
    profilesRepository = module.get<Repository<Profile>>(
      getRepositoryToken(Profile),
    );
  });

  it('should be defined', () => {
    expect(profilesService).toBeDefined();
  });

  describe('update()', () => {
    const updateResult: UpdateResult = {
      raw: {},
      generatedMaps: [],
      affected: 1,
    };

    it('should update a profile', async () => {
      jest
        .spyOn(profilesRepository, 'findOne')
        .mockResolvedValueOnce(mockProfile);
      jest.spyOn(profilesRepository, 'update').mockResolvedValue(updateResult);
      jest
        .spyOn(profilesRepository, 'findOne')
        .mockResolvedValueOnce(updatedProfile);

      const result = await profilesService.update('1', updateProfileDto);

      expect(result).toEqual(updatedProfile);

      expect(profilesRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: '1' } },
      });
      expect(profilesRepository.findOne).toHaveBeenCalledTimes(2);
      expect(profilesRepository.findOne).toHaveBeenCalledTimes(2);
      expect(profilesRepository.update).toHaveBeenCalledWith('1', {
        ...updateProfileDto,
        birthdate: new Date(updateProfileDto.birthdate as string),
      });
    });

    it('should update a profile when date is not provided', async () => {
      jest
        .spyOn(profilesRepository, 'findOne')
        .mockResolvedValueOnce(mockProfile);
      jest.spyOn(profilesRepository, 'update').mockResolvedValue(updateResult);
      jest
        .spyOn(profilesRepository, 'findOne')
        .mockResolvedValueOnce(updatedProfile);

      const result = await profilesService.update('1', {
        ...updateProfileDto,
        birthdate: undefined,
      });

      expect(result).toEqual(updatedProfile);

      expect(profilesRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: '1' } },
      });
      expect(profilesRepository.findOne).toHaveBeenCalledTimes(2);
      expect(profilesRepository.update).toHaveBeenCalledWith('1', {
        ...updateProfileDto,
        birthdate: undefined,
      });
    });

    it('should throw an error if the profile does not exist', async () => {
      jest
        .spyOn(profilesRepository, 'findOne')
        .mockResolvedValue(undefined as any);

      await expect(
        profilesService.update('1', updateProfileDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        profilesService.update('1', updateProfileDto),
      ).rejects.toThrow('Profile not found');
    });
  });
});
