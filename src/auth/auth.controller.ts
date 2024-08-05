import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';

import { LocalStrategy } from './local.strategy';

import { LoginResponseSchema } from '../swagger/schemas/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    type: LoginResponseSchema,
    description: 'Return token',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    example: 'Invalid credentials',
  })
  @ApiBody({ type: LoginAuthDto })
  @UseGuards(LocalStrategy)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() request: any) {
    return this.authService.login(request.user);
  }
}
