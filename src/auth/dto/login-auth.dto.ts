import {
  IsNotEmpty,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @MaxLength(30)
  @IsStrongPassword()
  password: string;

  constructor(partial?: Partial<LoginAuthDto>) {
    Object.assign(this, partial);
  }
}
