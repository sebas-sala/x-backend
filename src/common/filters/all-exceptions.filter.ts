import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { HttpExceptionFilter } from './http-exception.filter';

@Catch()
export class AllExceptionsFilter
  extends BaseWsExceptionFilter
  implements HttpExceptionFilter
{
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
