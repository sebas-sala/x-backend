import { validate } from 'class-validator';

import { UpdateProfileDto } from '@/src/profiles/dto/update-profile.dto';

describe('UpdateProfileDto', () => {
  let updateProfileDto: UpdateProfileDto;

  beforeEach(() => {
    updateProfileDto = new UpdateProfileDto();
    updateProfileDto.bio = 'Bio 1';
    updateProfileDto.location = 'Location 1';
    updateProfileDto.birthdate = new Date().toISOString();
    updateProfileDto.website = 'website.com';
    updateProfileDto.isPublic = true;
  });

  it('should be defined', () => {
    expect(updateProfileDto).toBeDefined();
  });

  it('should pass if all fields are valid', async () => {
    const errors = await validate(updateProfileDto);
    expect(errors.length).toBe(0);
  });

  it('should fail if bio is not a string', async () => {
    updateProfileDto.bio = 123 as any;

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('bio');
    expect(errors[0].constraints?.isString).toBe('bio must be a string');
  });

  it('should fail if bio is longer than 100 characters', async () => {
    updateProfileDto.bio = 'a'.repeat(101);

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('bio');
    expect(errors[0].constraints?.maxLength).toBe(
      'bio must be shorter than or equal to 100 characters',
    );
  });

  it('should fail if location is not a string', async () => {
    updateProfileDto.location = 123 as any;

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('location');
    expect(errors[0].constraints?.isString).toBe('location must be a string');
  });

  it('should fail if location is longer than 100 characters', async () => {
    updateProfileDto.location = 'a'.repeat(101);

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('location');
    expect(errors[0].constraints?.maxLength).toBe(
      'location must be shorter than or equal to 100 characters',
    );
  });

  it('should fail if birthdate is not a date string', async () => {
    updateProfileDto.birthdate = 123 as any;

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('birthdate');
    expect(errors[0].constraints?.isDateString).toBe(
      'birthdate must be a valid ISO 8601 date string',
    );
  });

  it('should fail if website is not a string', async () => {
    updateProfileDto.website = 123 as any;

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('website');
    expect(errors[0].constraints?.isString).toBe('website must be a string');
  });

  it('should fail if website is longer than 100 characters', async () => {
    updateProfileDto.website = 'a'.repeat(101);

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('website');
    expect(errors[0].constraints?.maxLength).toBe(
      'website must be shorter than or equal to 100 characters',
    );
  });

  it('should fail if isPublic is not a boolean', async () => {
    updateProfileDto.isPublic = 123 as any;

    const errors = await validate(updateProfileDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('isPublic');
    expect(errors[0].constraints?.isBoolean).toBe(
      'isPublic must be a boolean value',
    );
  });
});
