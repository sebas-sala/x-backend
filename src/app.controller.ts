import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Get hello' })
  @ApiResponse({
    status: 200,
    description: 'Return hello',
    example: 'Hello World!',
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
