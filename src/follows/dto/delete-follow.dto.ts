import { CreateFollowDto } from './create-follow.dto';

export class DeleteFollowDto extends CreateFollowDto {
  constructor(partial?: Partial<DeleteFollowDto>) {
    super();
    Object.assign(this, partial);
  }
}
