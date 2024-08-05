import {
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  // @ApiHideProperty()
  // @IsOptional()
  // @IsNotEmpty()
  // @MinLength(3)
  // @MaxLength(20)
  // username: string;

  @IsNotEmpty()
  @MaxLength(30)
  @IsStrongPassword()
  password: string;

  constructor(partial?: Partial<LoginAuthDto>) {
    Object.assign(this, partial);
  }
}
