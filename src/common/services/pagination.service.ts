import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../dto/pagination.dto';

interface Paginate {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number;
  nextPage?: number;
}

@Injectable()
export class PaginationService {
  paginate({ page = 1, limit = 10 }: PaginationDto): Paginate {
    return {
      page,
      limit,
      skip: PaginationDto.skip(page, limit),
    };
  }

  metaPagination(page: number, limit: number, total: number): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasPrevPage: page > 1,
      hasNextPage: total > page * limit,
      prevPage: page > 1 ? page - 1 : undefined,
      nextPage: total > page * limit ? page + 1 : undefined,
    };
  }
}
