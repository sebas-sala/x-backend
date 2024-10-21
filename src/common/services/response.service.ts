import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../dto/pagination.dto';

@Injectable()
export class ResponseService {
  successResponse<T>(
    { data, meta }: { data: T; meta?: { pagination?: PaginationDto } },
    status = 200,
  ) {
    return {
      data,
      meta,
      success: true,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  errorResponse(error: any, status = 500) {
    return {
      data: error.response || undefined,
      message: error.message || 'An error occurred',
      status: error.status || status,
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}
