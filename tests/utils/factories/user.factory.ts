import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '@/src/users/entities/user.entity';
import { CreateUserDto } from '@/src/users/dto/create-user.dto';

import { BCRYPT_SALT_ROUNDS } from '@/src/config/constants';

export default class UserFactory {
  constructor(private dataSource?: DataSource) {}

  static createUserDto(userData: Partial<CreateUserDto> = {}): CreateUserDto {
    return {
      name: userData.name ?? faker.person.fullName(),
      email: userData.email ?? faker.internet.email(),
      username: userData.username ?? faker.internet.username(),
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

    const saltOrRounds = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const encryptedPassword = await bcrypt.hash(userDto.password, saltOrRounds);

    const usersRepository = this.dataSource.getRepository(User);
    const user = usersRepository.create({
      ...userDto,
      password: encryptedPassword,
    });
    try {
      return await usersRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  async createManyUserEntities(count: number): Promise<User[]> {
    if (!this.dataSource) {
      throw new Error('DataSource is required to create a User entity.');
    }

    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const user = await this.createUserEntity();
      users.push(user);
    }

    return users;
  }
}
