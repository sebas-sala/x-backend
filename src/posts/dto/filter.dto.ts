import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsString()
  by_user_id?: string;

  @IsOptional()
  @IsString()
  by_username?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  by_like?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  by_following?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  by_bookmarked?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  by_reply: boolean = false;

  @IsOptional()
  @IsUUID()
  by_parent?: string;
}
