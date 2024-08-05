import { LoginAuthDto } from '@/src/auth/dto/login-auth.dto';
import AuthFactory from '@/tests/utils/factories/auth.factory';
import { validate } from 'class-validator';

describe('LoginAuthDto', () => {
  let loginAuthDto: LoginAuthDto;

  beforeEach(() => {
    loginAuthDto = AuthFactory.loginDto();
  });

  it('should be defined', () => {
    expect(loginAuthDto).toBeDefined();
  });

  it('should pass if all fields are valid', async () => {
    const errors = await validate(loginAuthDto);
    expect(errors.length).toBe(0);
  });

  it('should fail if email is empty', async () => {
    loginAuthDto.email = '';

    const errors = await validate(loginAuthDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isNotEmpty).toBe('email should not be empty');
  });

  it('should fail if email is not an email', async () => {
    loginAuthDto.email = 'invalid';

    const errors = await validate(loginAuthDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBe('email must be an email');
  });

  it('should fail if email length is higher than 50', async () => {
    loginAuthDto.email = 'a'.repeat(51) + '@gmail.com';

    const errors = await validate(loginAuthDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.maxLength).toBe(
      'email must be shorter than or equal to 50 characters',
    );
  });

  it('should fail if password is empty', async () => {
    loginAuthDto.password = '';

    const errors = await validate(loginAuthDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'password should not be empty',
    );
  });

  it('should fail if password is not a strong password', async () => {
    loginAuthDto.password = 'invalid';

    const errors = await validate(loginAuthDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.isStrongPassword).toBe(
      'password is not strong enough',
    );
  });

  it('should fail if password length is higher than 30', async () => {
    loginAuthDto.password = 'a'.repeat(31);

    const errors = await validate(loginAuthDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.maxLength).toBe(
      'password must be shorter than or equal to 30 characters',
    );
  });
});
