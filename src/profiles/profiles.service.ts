import { Injectable } from '@nestjs/common';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async create(
    user: User,
    createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    const profile = this.profilesRepository.create({
      ...createProfileDto,
      user,
    });

    return await this.profilesRepository.save(profile);
  }

  findOne(id: number) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }
}
