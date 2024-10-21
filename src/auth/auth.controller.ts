import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { LocalStrategy } from './local.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalStrategy)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() request: any) {
    return this.authService.login(request.user);
  }
}
