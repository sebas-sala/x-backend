import { toBoolean } from '@/src/utils/boolean.util';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class JwtAuthPublicGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const session = request.cookies?.['__session'];

    if (!session) {
      const token = request.cookies?.['token'];

      if (token && toBoolean(token)) {
        request.headers.authorization = `Bearer ${token}`;
        return super.canActivate(context);
      }

      return true;
    }

    const jwtSession = session.toString().split('.')[0];

    if (!jwtSession) {
      return true;
    }

    let decodedSession: Record<string, any>;

    try {
      decodedSession = jwtDecode(jwtSession, { header: true });
    } catch {
      return true;
    }

    const token = decodedSession.token;

    if (!token) {
      return true;
    }

    request.headers.authorization = `Bearer ${token}`;

    return super.canActivate(context);
  }
}
