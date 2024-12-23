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
  perPage: number = 15;
}
