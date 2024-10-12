import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io-client';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>();

    const errorResponse = {
      success: false,
      message: exception.message,
      data: exception.getError(),
      timestamp: new Date().toISOString(),
    };

    client.emit('error', errorResponse);
  }
}
