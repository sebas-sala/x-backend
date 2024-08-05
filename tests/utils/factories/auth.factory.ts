import { faker } from '@faker-js/faker';

import { LoginAuthDto } from '@/src/auth/dto/login-auth.dto';

export default class AuthFactory {
  constructor() {}

  static loginDto({
    email,
    password,
  }: Partial<LoginAuthDto> = {}): LoginAuthDto {
    const loginAuthDto: LoginAuthDto = new LoginAuthDto({
      email: email || faker.internet.email(),
      password:
        password ||
        faker.internet.password({
          prefix: 'Aa!',
          length: 15,
        }),
    });

    return loginAuthDto;
  }
}
