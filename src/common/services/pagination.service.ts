import { Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { ClassConstructor, plainToInstance } from 'class-transformer';

interface PaginateOptions<T> {
  query: SelectQueryBuilder<ObjectLiteral>;
  page?: number;
  perPage?: number;
  dto?: ClassConstructor<T>;
  nestedPagination?: boolean;
  snakeCase?: boolean;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number;
  nextPage?: number;
}

interface PaginationSnakeCase {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_prev_page: boolean;
  has_next_page: boolean;
  prev_page?: number;
  next_page?: number;
}

export type PaginatedMeta =
  | Pagination
  | PaginationSnakeCase
  | { pagination: Pagination | PaginationSnakeCase };

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

@Injectable()
export class PaginationService {
  private setPagination(
    snakeCase: boolean,
    page: number,
    perPage: number,
    total: number,
  ): Pagination | PaginationSnakeCase {
    const pagination = snakeCase
      ? {
          page,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
          has_prev_page: page > 1,
          has_next_page: total > page * perPage,
          prev_page: page > 1 ? page - 1 : undefined,
          next_page: total > page * perPage ? page + 1 : undefined,
        }
      : {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
          hasPrevPage: page > 1,
          hasNextPage: total > page * perPage,
          prevPage: page > 1 ? page - 1 : undefined,
          nextPage: total > page * perPage ? page + 1 : undefined,
        };

    return pagination;
  }

  private setMeta(
    nestedPagination: boolean,
    pagination: Pagination | PaginationSnakeCase,
  ) {
    return nestedPagination ? { pagination } : { ...pagination };
  }

  async paginate<T>({
    query,
    dto,
    page = 1,
    perPage = 15,
    nestedPagination = true,
    snakeCase = false,
  }: PaginateOptions<T>): Promise<PaginatedResult<T>> {
    this.validations(page, perPage);
    const skip = (page - 1) * perPage;

    const [data, total] = await query
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    const pagination = this.setPagination(snakeCase, page, perPage, total);

    const meta = this.setMeta(nestedPagination, pagination);

    const result = {
      data: dto ? plainToInstance(dto, data) : (data as T[]),
      meta: {
        ...meta,
      },
    };

    return result;
  }

  validations(page: number, perPage: number) {
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (perPage < 1) {
      throw new Error('PerPage must be greater than 0');
    }
  }
}
