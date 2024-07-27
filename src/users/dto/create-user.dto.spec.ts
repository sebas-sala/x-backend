import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  let createUserDto: CreateUserDto;

  beforeEach(() => {
    createUserDto = new CreateUserDto();
    createUserDto.name = 'John Doe';
    createUserDto.email = 'test@test.com';
    createUserDto.username = 'johndoe';
    createUserDto.password = 'P@sswowdroein!@3';
  });

  it('should be defined', () => {
    expect(createUserDto).toBeDefined();
  });

  it('should pass if all fields are valid', async () => {
    const errors = await validate(createUserDto);
    expect(errors.length).toBe(0);
  });

  it('should fail if name is empty', async () => {
    createUserDto.name = '';

    const errors = await validate(createUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isNotEmpty).toBe('name should not be empty');
  });

  it('should fail if email is empty', async () => {
    createUserDto.email = '';

    const errors = await validate(createUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isNotEmpty).toBe('email should not be empty');
  });

  it('should fail if email is invalid', async () => {
    createUserDto.email = 'invalid-email';

    const errors = await validate(createUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBe('email must be an email');
  });

  it('should fail if username is empty', async () => {
    createUserDto.username = '';

    const errors = await validate(createUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'username should not be empty',
    );
  });

  it('should fail if password is empty', async () => {
    createUserDto.password = '';

    const errors = await validate(createUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'password should not be empty',
    );
  });

  it('should fail if password is weak', async () => {
    createUserDto.password = 'weakpassword';

    const errors = await validate(createUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.isStrongPassword).toBe(
      'password is not strong enough',
    );
  });
});
