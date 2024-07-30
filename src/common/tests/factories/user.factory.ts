import { Repository } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';

type Parameters_ = {
  userRepository: Repository<User>;
  userDate?: Partial<User>;
};

/**
 * Creates a test user.
 * @param userRepository - Users repository.
 * @param userData - Optional data to override default values.
 * @returns The created user.
 */
export async function createTestUser({
  userRepository,
  userDate = {},
}: Parameters_): Promise<User> {
  const defaultData = {
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'password',
  };

  const user = userRepository.create({ ...defaultData, ...userDate });
  try {
    return await userRepository.save(user);
  } catch (error) {
    throw error;
  }
}
