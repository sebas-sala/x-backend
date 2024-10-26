import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { ResponseService } from '../common/services/response.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private responseService: ResponseService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() request: any) {
    const token = await this.authService.login(request.user);
    return this.responseService.successResponse({
      data: token,
    });
  }
}
