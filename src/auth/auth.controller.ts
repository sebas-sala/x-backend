import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
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
  async login(@Req() req: any) {
    const { access_token, user } = await this.authService.login(req.user);

    return this.responseService.successResponse({
      data: {
        access_token,
        user,
      },
    });
  }
}
