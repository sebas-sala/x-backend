import { SetMetadata } from '@nestjs/common';
import { Role } from '../decorators/roles.decorator';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
