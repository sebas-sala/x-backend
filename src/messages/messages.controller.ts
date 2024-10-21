import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ResponseService } from '../common/services/response.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() currentUser: User,
  ) {
    const message = await this.messagesService.create(
      createMessageDto,
      currentUser,
    );
    return this.responseService.successResponse({ data: message });
  }
}
