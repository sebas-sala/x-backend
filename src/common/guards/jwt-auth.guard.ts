import { AuthGuard } from '@nestjs/passport';
import {
  type ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  private readonly logger = new Logger(JwtAuthGuard.name);
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const session = request.cookies?.['__session'];

    if (!session) {
      throw new UnauthorizedException();
    }

    const jwtSession = session.toString().split('.')[0];

    if (!jwtSession) {
      throw new UnauthorizedException();
    }

    let decodedSession: Record<string, any>;

    try {
      decodedSession = jwtDecode(jwtSession, { header: true });
    } catch (error) {
      this.logger.error('Failed to decode session', error);
      throw new UnauthorizedException('Invalid session token');
    }

    const token = decodedSession.token;

    if (!token) {
      throw new UnauthorizedException();
    }

    request.headers.authorization = `Bearer ${token}`;
    return super.canActivate(context);
  }
}
