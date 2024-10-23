import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

interface PaginateOptions<T extends ObjectLiteral> {
  query: SelectQueryBuilder<T>;
  page?: number;
  perPage?: number;
  snakeCase?: boolean;
  nestedPagination?: boolean;
}

interface PaginationCamelCase {
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

export type Pagination = PaginationCamelCase | PaginationSnakeCase;

export type Meta = { pagination: Pagination } | Pagination;

export interface PaginatedResult<T> {
  data: T[];
  meta: Meta;
}

@Injectable()
export class PaginationService {
  private setPagination({
    page,
    perPage,
    total,
    snakeCase,
  }: {
    page: number;
    perPage: number;
    total: number;
    snakeCase: boolean;
  }): Pagination {
    const totalPages = Math.ceil(total / perPage);
    const hasPrevPage = page > 1;
    const hasNextPage = total > page * perPage;
    const prevPage = page > 1 ? page - 1 : undefined;
    const nextPage = total > page * perPage ? page + 1 : undefined;

    if (snakeCase) {
      return {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
        has_prev_page: hasPrevPage,
        has_next_page: hasNextPage,
        prev_page: prevPage,
        next_page: nextPage,
      };
    }

    return {
      page,
      perPage,
      total,
      totalPages,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    };
  }

  private setMeta(nestedPagination: boolean, pagination: Pagination): Meta {
    return nestedPagination ? { pagination } : pagination;
  }

  async paginate<T extends ObjectLiteral>({
    query,
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

    const pagination = this.setPagination({
      page,
      perPage,
      total,
      snakeCase,
    });

    const meta = this.setMeta(nestedPagination, pagination);

    return {
      data,
      meta,
    };
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
