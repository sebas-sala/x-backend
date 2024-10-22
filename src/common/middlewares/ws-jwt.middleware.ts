import * as jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

import { UsersService } from '@/src/users/users.service';

@Injectable()
export class WsAuthMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake?.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        sub: string;
        username: string;
      };

      const user = await this.usersService.findOneByUsernameOrFail({
        username: decoded.username,
      });

      socket.handshake.auth = user;

      return next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  }
}
