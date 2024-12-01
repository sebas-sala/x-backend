import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { View } from './entities/view.entity';
import { CreateViewDto } from './dto/create-view.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ViewsService {
  constructor(
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,
  ) {}

  async create(createViewDto: CreateViewDto, currentUser: User) {
    await this.validateViewDoesNotExists(createViewDto.postId, currentUser.id);

    const view = this.viewRepository.create({
      post: { id: createViewDto.postId },
      user: { id: currentUser.id },
    });

    return this.viewRepository.save(view);
  }

  findByPostIdAndUserId(postId: string, userId: string) {
    return this.viewRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });
  }

  private async validateViewDoesNotExists(postId: string, userId: string) {
    const view = await this.findByPostIdAndUserId(postId, userId);

    if (view) {
      throw new ConflictException('View already exists');
    }
  }
}
