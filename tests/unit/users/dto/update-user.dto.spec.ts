import { validate } from 'class-validator';

import { UpdateUserDto } from '@/src/users/dto/update-user.dto';

describe('UpdateUserDto', () => {
  let updateUserDto: UpdateUserDto;

  beforeEach(() => {
    updateUserDto = new UpdateUserDto();
    updateUserDto.name = 'John Doe';
    updateUserDto.email = 'test@test.com';
    updateUserDto.username = 'johndoe';
    updateUserDto.password = 'P@sswowdroein!@3';
  });

  it('should be defined', () => {
    expect(updateUserDto).toBeDefined();
  });

  it('should pass if all fields are valid', async () => {
    const errors = await validate(updateUserDto);
    expect(errors.length).toBe(0);
  });

  it('should fail if name is empty', async () => {
    updateUserDto.name = '';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isNotEmpty).toBe('name should not be empty');
  });

  it('should fail if name is not a string', async () => {
    updateUserDto.name = 1 as unknown as string;

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.isString).toBe('name must be a string');
  });

  it('should fail if name is too short', async () => {
    updateUserDto.name = 'Jo';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.minLength).toBe(
      'name must be longer than or equal to 3 characters',
    );
  });

  it('should fail if name is too long', async () => {
    updateUserDto.name = 'a'.repeat(51);

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints?.maxLength).toBe(
      'name must be shorter than or equal to 50 characters',
    );
  });

  it('should fail if email is empty', async () => {
    updateUserDto.email = '';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isNotEmpty).toBe('email should not be empty');
  });

  it('should fail if email is invalid', async () => {
    updateUserDto.email = 'invalid-email';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBe('email must be an email');
  });

  it('should fail if email is too long', async () => {
    updateUserDto.email = 'a'.repeat(51) + '@test.com';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.maxLength).toBe(
      'email must be shorter than or equal to 50 characters',
    );
  });

  it('should fail if username is empty', async () => {
    updateUserDto.username = '';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'username should not be empty',
    );
  });

  it('should fail if username is not a string', async () => {
    updateUserDto.username = 1 as unknown as string;

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints?.isString).toBe('username must be a string');
  });

  it('should fail if username is too short', async () => {
    updateUserDto.username = 'ab';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints?.minLength).toBe(
      'username must be longer than or equal to 3 characters',
    );
  });

  it('should fail if username is too long', async () => {
    updateUserDto.username = 'a'.repeat(21);

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints?.maxLength).toBe(
      'username must be shorter than or equal to 20 characters',
    );
  });

  it('should fail if password is empty', async () => {
    updateUserDto.password = '';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'password should not be empty',
    );
  });

  it('should fail if password is weak', async () => {
    updateUserDto.password = 'weakpassword';

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.isStrongPassword).toBe(
      'password is not strong enough',
    );
  });

  it('should fail if password is too long', async () => {
    updateUserDto.password = 'a'.repeat(31);

    const errors = await validate(updateUserDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints?.maxLength).toBe(
      'password must be shorter than or equal to 30 characters',
    );
  });
});
