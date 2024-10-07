import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Chat } from './entities/chat.entity';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createChatDto: CreateChatDto,
    @CurrentUser() currentUser: User,
  ): Promise<Chat> {
    return await this.chatsService.create(createChatDto, currentUser);
  }
}
