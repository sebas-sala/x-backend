import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  successResponse(data: any, status = 200) {
    return {
      data,
      success: true,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  errorResponse(error: any, status = 500) {
    return {
      data: error.response || null,
      message: error.message || 'An error occurred',
      status: error.status || status,
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}
