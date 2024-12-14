import {
  Controller,
  forwardRef,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';

import { User } from '../users/entities/user.entity';

import { ResponseService } from '../common/services/response.service';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly responseService: ResponseService,

    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() pagination: PaginationDto,
    @Query('orderBy') orderBy: string = 'createdAt',
  ) {
    const { data, meta } = await this.notificationsService.findAll({
      currentUser,
      pagination,
      orderBy,
    });

    return this.responseService.successResponse({ data, meta }, 200);
  }
}
