import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsArray()
  users: string[];

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isChatGroup?: boolean;

  constructor(createChatDto: Partial<CreateChatDto>) {
    Object.assign(this, createChatDto);
  }
}
