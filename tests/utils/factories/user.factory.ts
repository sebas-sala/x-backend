import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { CreateUserDto } from '@/src/users/dto/create-user.dto';

export default class UserFactory {
  constructor(private dataSource?: DataSource) {}

  static createUserDto(userData: Partial<CreateUserDto> = {}): CreateUserDto {
    return {
      name: userData.name ?? faker.person.fullName(),
      email: userData.email ?? faker.internet.email(),
      username: userData.username ?? faker.internet.userName(),
      password:
        userData.password ??
        faker.internet.password({
          length: 20,
          prefix: 'Aa1!',
        }),
    };
  }

  static createUserData(userData: Partial<User> = {}): Partial<User> {
    return {
      id: userData.id ?? faker.string.uuid(),
      ...UserFactory.createUserDto(userData),
      createdAt: userData.createdAt ?? faker.date.recent(),
      updatedAt: userData.updatedAt ?? faker.date.recent(),
    };
  }

  async createUserEntity(userData: Partial<User> = {}): Promise<User> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a User entity.');
    }

    const userDto = UserFactory.createUserDto(userData);
    const usersRepository = this.dataSource.getRepository(User);
    const user = usersRepository.create(userDto);

    try {
      return await usersRepository.save(user);
    } catch (error) {
      throw error;
    }
  }
}
