import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Min(1)
  @IsInt()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @Min(1)
  @IsInt()
  @Type(() => Number)
  limit: number = 10;

  constructor(page?: number, limit?: number) {
    this.page = page ?? 1;
    this.limit = limit ?? 10;
  }

  static skip(page: number, limit: number) {
    return (page - 1) * limit;
  }
}
