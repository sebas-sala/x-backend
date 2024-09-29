import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const wsContext = host.switchToWs();
    const client = wsContext.getClient();

    const errorResponse = exception.getError() as {
      status?: number;
      message?: string;
      name?: string;
      response?: {
        message?: string;
        statusCode?: number;
        error?: string;
      };
    };

    const statusCode = errorResponse.status || 500;
    const error = errorResponse.name || 'Internal Server Error';
    const message = errorResponse.message || exception.message;

    const response = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
    };

    console.log('WsExceptionFilter', response);

    client.send(response);
  }
}
