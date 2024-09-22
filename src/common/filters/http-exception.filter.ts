import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationErrorResponse {
  message: string[];
  statusCode: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception.getStatus();

    let errorMessage = exception.message;

    if (exception.getResponse() instanceof Object) {
      const validationErrors =
        exception.getResponse() as ValidationErrorResponse;

      if (validationErrors.message && Array.isArray(validationErrors.message)) {
        errorMessage = validationErrors.message[0];
      }
    }

    response.status(status).send({
      path: request.url,
      statusCode: status,
      error: exception.name,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
