import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ViewsService } from './views.service';
import { CreateViewDto } from './dto/create-view.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResponseService } from '../common/services/response.service';

@Controller('views')
export class ViewsController {
  constructor(
    private readonly viewsService: ViewsService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createViewDto: CreateViewDto,
    @CurrentUser() currentUser: User,
  ) {
    const res = await this.viewsService.create(createViewDto, currentUser);

    return this.responseService.successResponse({ data: res });
  }
}
