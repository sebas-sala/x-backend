import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginAuthDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @MaxLength(30)
  @IsStrongPassword()
  password: string;
}
