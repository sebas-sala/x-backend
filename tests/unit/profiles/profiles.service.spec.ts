import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';

import { Profile } from '@/src/profiles/entities/profile.entity';
import { ProfilesService } from '@/src/profiles/profiles.service';
import { User } from '@/src/users/entities/user.entity';

import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';
import ProfileFactory, {
  mockProfilesRepository,
} from '@/tests/utils/factories/profile.factory';
import { Follow } from '@/src/follows/entities/follow.entity';

// const mockProfile: Profile = {
//   id: '1',
//   bio: 'test bio',
//   birthdate: new Date(),
//   isPublic: false,
//   location: 'test location',
//   website: 'test website',
//   updatedAt: new Date(),
//   user: undefined as any,
// };

// const updateProfileDto: UpdateProfileDto = {
//   bio: 'new bio',
//   birthdate: new Date().toISOString(),
//   isPublic: true,
//   location: 'new location',
//   website: 'new website',
// };

// const updatedProfile: Profile = {
//   ...mockProfile,
//   ...updateProfileDto,
//   birthdate: new Date(updateProfileDto.birthdate as string),
// };

describe('ProfilesService', () => {
  let profilesService: ProfilesService;
  const profilesRepository = mockProfilesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Profile, User, Follow]),
      ],
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(Profile),
          useValue: profilesRepository,
        },
      ],
    }).compile();

    profilesService = module.get<ProfilesService>(ProfilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    it('Should update a profile with full data', async () => {
      // Arrange
      const mockProfile = ProfileFactory.createProfileData();
      const updateProfileDto =
        ProfileFactory.createProfileDto() as UpdateProfileDto;

      profilesRepository.findOne.mockResolvedValueOnce(mockProfile);
      profilesRepository.update.mockResolvedValue({
        ...updateResult,
        raw: updateProfileDto,
      });
      profilesRepository.findOne.mockResolvedValueOnce({
        ...updateProfileDto,
      });

      // Act
      const result = await profilesService.update(
        mockProfile.id as string,
        updateProfileDto,
      );

      // Assert
      expect(result).toMatchObject({
        ...updateProfileDto,
      });

      expect(profilesRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockProfile.id } },
      });
      expect(profilesRepository.findOne).toHaveBeenCalledTimes(2);
      expect(profilesRepository.update).toHaveBeenCalledWith(mockProfile.id, {
        ...updateProfileDto,
        birthdate: new Date(updateProfileDto.birthdate!),
      });
    });

    it('Should update a profile with partial data', async () => {
      // Arrange
      const mockProfile = ProfileFactory.createProfileData();
      const updateProfileDto = {
        bio: 'new bio',
      } as UpdateProfileDto;

      profilesRepository.findOne.mockResolvedValueOnce(mockProfile);
      profilesRepository.update.mockResolvedValue({
        ...updateResult,
      });
      profilesRepository.findOne.mockResolvedValueOnce(updateProfileDto);

      // Act
      const result = await profilesService.update(
        mockProfile.id as string,
        updateProfileDto,
      );

      // Assert
      expect(result).toMatchObject({
        ...updateProfileDto,
      });
      expect(profilesRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockProfile.id } },
      });
      expect(profilesRepository.findOne).toHaveBeenCalledTimes(2);
      expect(profilesRepository.update).toHaveBeenCalledWith(mockProfile.id, {
        ...updateProfileDto,
      });
    });

    it('should throw not found exception if the profile does not exist', async () => {
      profilesRepository.findOne.mockResolvedValue(undefined);

      await expect(
        profilesService.update('1', ProfileFactory.createProfileDto()),
      ).rejects.toThrow(NotFoundException);
      await expect(
        profilesService.update('1', ProfileFactory.createProfileDto()),
      ).rejects.toThrow('Profile not found');
    });

    it('should throw an error if the update fails', async () => {
      const mockProfile = ProfileFactory.createProfileData();
      const updateProfileDto = ProfileFactory.createProfileDto();

      profilesRepository.findOne.mockResolvedValueOnce(mockProfile);
      profilesRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        profilesService.update(mockProfile.id as string, updateProfileDto),
      ).rejects.toThrow('Update failed');
    });
  });
});
