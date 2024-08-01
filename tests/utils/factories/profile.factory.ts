import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';

import { User } from '@/src/users/entities/user.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';

type profileEntityFactoryParams = {
  dataSource: DataSource;
  user: User;
  profileData?: Partial<Profile>;
};

export async function profileEntityFactory({
  dataSource,
  user,
  profileData,
}: profileEntityFactoryParams): Promise<Profile> {
  const profileDto = profileDtoFactory({ profileData });

  const profile = Object.assign(new Profile(), profileDto);

  try {
    const _profile = await dataSource.manager.save(profile);

    user.profile = _profile;

    const usersRepository = dataSource.getRepository(User);
    await usersRepository.save(user);

    return _profile;
  } catch (error) {
    throw error;
  }
}

type profileDtoFactoryParams = {
  profileData?: Partial<Profile>;
};

export function profileDtoFactory({
  profileData,
}: profileDtoFactoryParams = {}) {
  return {
    bio: profileData?.bio || faker.lorem.sentence(),
    location: profileData?.location || faker.location.city(),
    birthdate: profileData?.birthdate || faker.date.past(),
    website: profileData?.website || faker.internet.url(),
    isPublic: profileData?.isPublic || faker.datatype.boolean(),
  };
}
