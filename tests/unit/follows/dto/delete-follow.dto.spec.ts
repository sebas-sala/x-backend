import { DeleteFollowDto } from '@/src/follows/dto/delete-follow.dto';
import FollowFactory from '@/tests/utils/factories/follow.factory';
import { validate } from 'class-validator';

describe('DeleteFollowDto', () => {
  let deleteFollowDto: DeleteFollowDto;

  beforeEach(() => {
    deleteFollowDto = FollowFactory.deleteFollowDto();
  });

  it('should be defined', () => {
    expect(deleteFollowDto).toBeDefined();
  });

  it('should pass if all fields are valid', async () => {
    const errors = await validate(deleteFollowDto);
    expect(errors.length).toBe(0);
  });

  it('should fail if followerId is empty', async () => {
    deleteFollowDto.followerId = '';

    const errors = await validate(deleteFollowDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followerId');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'followerId should not be empty',
    );
  });

  it('should fail if followerId is not a UUID', async () => {
    deleteFollowDto.followerId = 'invalid';

    const errors = await validate(deleteFollowDto);
    console.log(errors);
    expect(errors[0].property).toBe('followerId');
    expect(errors[0].constraints?.isUuid).toBe('followerId must be a UUID');
  });

  it('should fail if followingId is empty', async () => {
    deleteFollowDto.followingId = '';

    const errors = await validate(deleteFollowDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followingId');
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'followingId should not be empty',
    );
  });

  it('should fail if followingId is not a UUID', async () => {
    deleteFollowDto.followingId = 'invalid';

    const errors = await validate(deleteFollowDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followingId');
    expect(errors[0].constraints?.isUuid).toBe('followingId must be a UUID');
  });
});
