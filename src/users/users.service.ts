import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

import { Profile } from '@/src/profiles/entities/profile.entity';

import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';
import { BCRYPT_SALT_ROUNDS, DEFAULT_PROFILE } from '@/src/config/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly queryRunnerFactory: QueryRunnerFactory,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async getFollowers(userId: string): Promise<User[]> {
    return await this.usersRepository.find({
      where: { following: { id: userId } },
      relations: ['profile'],
    });
  }

  async getFollowing(userId: string): Promise<User[]> {
    return await this.usersRepository.find({
      where: { followers: { id: userId } },
      relations: ['profile'],
    });
  }

  async findOneById(id: string): Promise<User> {
    return await this.findOneBy({
      options: { id },
      error: 'User not found',
      relations: ['profile'],
    });
  }

  async findByUsername(username: string): Promise<User> {
    return await this.findOneBy({
      options: { username },
      error: 'User not found',
      relations: ['profile'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User | undefined> {
    const queryRunner = this.queryRunnerFactory.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { username, email, password } = createUserDto;

      await this.validateUserDoesNotExist(username, email, queryRunner.manager);

      const hashedPassword = await this.hashPassword(password);
      createUserDto.password = hashedPassword;

      const user = queryRunner.manager.create(User, createUserDto);
      await queryRunner.manager.save(User, user);

      const profile = queryRunner.manager.create(Profile, {
        user,
        ...DEFAULT_PROFILE,
      });
      await queryRunner.manager.save(Profile, profile);

      await queryRunner.commitTransaction();

      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOneBy({
    options,
    error,
    relations,
  }: {
    options: Record<string, unknown>;
    error: string;
    relations?: string[];
  }): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: options,
      relations,
    });

    if (!user) {
      throw new NotFoundException(error);
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltOrRounds = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    return await bcrypt.hash(password, saltOrRounds);
  }

  private async validateUserDoesNotExist(
    username: string,
    email: string,
    manager: EntityManager,
  ): Promise<void> {
    const existingUser = await manager.findOne(User, {
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }

      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
    }
  }
}
