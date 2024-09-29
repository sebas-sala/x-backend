import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Profile } from './entities/profile.entity';

import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    currentUser: User,
  ) {
    this.validateProfileOwner(userId, currentUser.id);

    let profile = await this.findProfileByUserId(userId);

    if (profile === null) {
      profile = await this.createProfile(currentUser, updateProfileDto);
    } else {
      this.updateProfile(profile.id, updateProfileDto);
    }

    return await this.findProfileOrFail(profile.id);
  }

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    return await this.profilesRepository.findOneBy({
      user: { id: userId },
    });
  }

  async findOneBy(options: any, relations?: string[]): Promise<Profile | null> {
    const profile = await this.profilesRepository.findOne({
      where: options,
      relations,
    });

    return profile;
  }

  async findOneByOrFail(options: any, relations?: string[]): Promise<Profile> {
    const profile = await this.findOneBy(options, relations);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async findProfileOrFail(profileId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOneBy({ id: profileId });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async createProfile(
    currentUser: User,
    createProfileDto: UpdateProfileDto,
  ) {
    const profile = this.profilesRepository.create({
      user: currentUser,
      ...createProfileDto,
    });

    await this.profilesRepository.save(profile);

    return await this.profilesRepository.findOneByOrFail({ id: profile.id });
  }

  private async updateProfile(
    profileId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<void> {
    const updatedDto = this.prepareUpdateDto(updateProfileDto);
    await this.profilesRepository.update(profileId, updatedDto);
  }

  // Convert a string date to a Date object
  private convertDate(date?: string): Date | undefined {
    return date ? new Date(date) : undefined;
  }

  private validateProfileOwner(profileId: string, userId: string) {
    if (profileId !== userId) {
      throw new UnprocessableEntityException(
        'You are not the owner of this profile',
      );
    }
  }

  // Prepare the updated DTO
  private prepareUpdateDto(updateProfileDto: UpdateProfileDto) {
    const { birthdate, ...rest } = updateProfileDto;
    return {
      ...rest,
      birthdate: this.convertDate(birthdate),
    };
  }
}
