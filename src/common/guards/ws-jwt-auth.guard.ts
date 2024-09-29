import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { User } from '@/src/users/entities/user.entity';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient();
    const authorizationHeader = client.handshake?.headers?.authorization;

    if (!authorizationHeader) {
      throw new WsException('Authorization token not found');
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
      throw new WsException('Authorization token not found');
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret',
      ) as any;

      const user = await this.userRepository.findOneBy({
        id: decoded.id,
      });

      context.switchToHttp().getRequest().user = user;
      wsContext.getData().user = user;

      return true;
    } catch (e) {
      throw new WsException('Invalid token');
    }
  }
}
