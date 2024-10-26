import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import type { AuthPayload } from './types/auth-request.types';
import type { LoginResponse } from './types/auth-response.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.usersService.findByUsername(username);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result as User;
    }

    return undefined;
  }

  async login(user: User): Promise<LoginResponse> {
    const payload: AuthPayload = {
      sub: user.id,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
