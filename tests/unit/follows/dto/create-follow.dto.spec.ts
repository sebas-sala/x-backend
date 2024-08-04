import { validate } from 'class-validator';

import { CreateFollowDto } from '@/src/follows/dto/create-follow.dto';

import FollowFactory from '@/tests/utils/factories/follow.factory';

describe('CreateFollowDto', () => {
  let createFollowDto: CreateFollowDto;

  beforeEach(() => {
    createFollowDto = FollowFactory.createFollowDto();
  });

  it('should be defined', () => {
    expect(createFollowDto).toBeDefined();
  });

  it('should pass if all fields are valid', async () => {
    const errors = await validate(createFollowDto);
    expect(errors.length).toBe(0);
  });

  it('should fail if followerId is empty', async () => {
    createFollowDto.followerId = '';

    const errors = await validate(createFollowDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followerId');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'followerId should not be empty',
    );
  });

  it('should fail if followerId is not a UUID', async () => {
    createFollowDto.followerId = 'invalid';

    const errors = await validate(createFollowDto);
    expect(errors[0].property).toBe('followerId');
    expect(errors[0].constraints?.isUuid).toBe('followerId must be a UUID');
  });

  it('should fail if followingId is empty', async () => {
    createFollowDto.followingId = '';

    const errors = await validate(createFollowDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followingId');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'followingId should not be empty',
    );
  });

  it('should fail if followingId is not a UUID', async () => {
    createFollowDto.followingId = 'invalid';

    const errors = await validate(createFollowDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followingId');
    expect(errors[0].constraints?.isUuid).toBe('followingId must be a UUID');
  });
});
