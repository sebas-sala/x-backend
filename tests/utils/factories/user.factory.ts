import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';

import { User } from '@/src/users/entities/user.entity';
import { CreateUserDto } from '@/src/users/dto/create-user.dto';

type userEntityFactoryParams = {
  dataSource: DataSource;
  userData?: Partial<User>;
};

export const userEntityFactory = async ({
  dataSource,
  userData = {},
}: userEntityFactoryParams): Promise<User> => {
  const userRepository = dataSource.getRepository(User);
  const user = userDtoFactory({ userData });
  return await userRepository.save(user);
};

type userDtoFactoryParams = {
  userData?: Partial<CreateUserDto>;
};

export function userDtoFactory({
  userData,
}: userDtoFactoryParams = {}): CreateUserDto {
  return {
    name: userData?.name || faker.person.fullName(),
    email: userData?.email || faker.internet.email(),
    username: userData?.username || faker.internet.userName(),
    password: userData?.password || faker.internet.password(),
  };
}
