import { Repository } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';

type Params = {
  profileRepository: Repository<Profile>;
  user: User;
  profileData?: Partial<Profile>;
};

/**
 * Creates a test profile.
 * @param {Params} params - The parameters for creating the test profile.
 * @param {ProfileRepository} params.profileRepository - The profile repository.
 * @param {User} params.user - The user.
 * @returns {Promise<Profile>} The created test profile.
 */
export async function createTestProfile({
  profileRepository,
  user,
  profileData = {},
}: Params): Promise<Profile> {
  const defaultData = {
    bio: 'Test bio',
  };

  const profile = new Profile();
  profile.user = user;
  try {
    return await profileRepository.save(profile);
  } catch (error) {
    throw error;
  }
}
