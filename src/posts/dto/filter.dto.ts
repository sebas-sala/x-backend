import { IsOptional, IsString } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsString()
  by_user_id?: string;

  @IsOptional()
  @IsString()
  by_username?: string;

  @IsOptional()
  @IsString()
  by_like?: boolean;
}
