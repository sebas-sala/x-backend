import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { User } from '@/src/users/entities/user.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';
import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';

export default class ProfileFactory {
  constructor(private dataSource?: DataSource) {}

  static createProfileDto(
    profileData: Partial<Profile> = {},
  ): UpdateProfileDto {
    return {
      bio: profileData.bio ?? faker.lorem.sentence(),
      location: profileData.location ?? faker.location.city(),
      birthdate: profileData.birthdate
        ? profileData.birthdate.toISOString()
        : faker.date.past().toISOString(),
      website: profileData.website ?? faker.internet.url(),
      isPublic: profileData.isPublic ?? faker.datatype.boolean(),
    };
  }

  static createProfileData(
    profileData: Partial<Profile> = {},
  ): Partial<Profile> {
    return {
      id: profileData.id ?? faker.string.uuid(),
      ...ProfileFactory.createProfileDto(profileData),
      updatedAt: profileData.updatedAt ?? faker.date.recent(),
    } as Partial<Profile>;
  }

  async createProfileEntity(
    user: User,
    profileData?: Partial<Profile>,
  ): Promise<Profile> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a Profile entity.');
    }

    const profileDto = ProfileFactory.createProfileDto(profileData);
    const profileRepository = this.dataSource.getRepository(Profile);
    const profile = profileRepository.create(profileDto);
    profile.user = user;

    try {
      const savedProfile = await profileRepository.save(profile);
      user.profile = savedProfile;

      await this.dataSource.manager.save(user);
      user.profile = savedProfile;

      await this.dataSource.getRepository(User).save(user);

      return savedProfile;
    } catch (error) {
      throw error;
    }
  }
}

export const mockProfilesService = {
  update: jest.fn(),
  findOneBy: jest.fn(),
};

export const mockProfilesRepository = {
  findOne: jest.fn(),
  update: jest.fn(),
};
