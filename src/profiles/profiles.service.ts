import { EntityNotFoundError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async update(userId: string, updateProfileDto: UpdateProfileDto) {
    // Find the profile by user ID
    const profile = await this.findOneBy({
      user: { id: userId },
    });

    // Prepare the updated DTO
    const updatedDto = this.prepareUpdateDto(updateProfileDto);

    // Update the profile
    await this.profilesRepository.update(profile.id, updatedDto);

    // Return the updated profile
    return await this.findOneBy({ id: profile.id });
  }

  // Convert a string date to a Date object
  private convertDate(date?: string): Date | undefined {
    return date ? new Date(date) : undefined;
  }

  // Prepare the updated DTO
  private prepareUpdateDto(updateProfileDto: UpdateProfileDto) {
    const { birthdate, ...rest } = updateProfileDto;
    return {
      ...rest,
      birthdate: this.convertDate(birthdate),
    };
  }

  // Find a profile by options
  private async findOneBy(options: any) {
    const profile = await this.profilesRepository.findOne(options);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }
}
