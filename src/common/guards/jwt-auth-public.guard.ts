import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthPublicGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const authToken = request.cookies['__session'];

    if (!authToken && !request.headers.authorization) {
      return true;
    }

    if (authToken) {
      request.headers.authorization = `Bearer ${authToken}`;
    }

    return super.canActivate(context);
  }
}
