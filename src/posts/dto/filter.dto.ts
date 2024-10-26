import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsString()
  by_user_id?: string;

  @IsOptional()
  @IsString()
  by_username?: string;

  @IsOptional()
  @IsString()
  @Type(() => Boolean)
  by_like?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  by_following?: boolean;
}
