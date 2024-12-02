import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class FiltersDto {
  @IsOptional()
  @IsString()
  by_query?: string;
}
