import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
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

  async findOneById(
    id: string,
    relations: string[] = [],
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });

    return user;
  }

  async findOneByIdOrFail(
    id: string,
    error?: string,
    relations: string[] = [],
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });

    if (!user) {
      throw new NotFoundException(error || 'User not found');
    }

    return user;
  }

  async findByUsername(
    username: string,
    relations: string[] = [],
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['profile', ...relations],
    });

    return user;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const users = await this.usersRepository.findBy({
      id: In(ids),
    });

    if (!users) {
      throw new NotFoundException('Users not found');
    }

    return users;
  }

  async findOneByUsernameOrFail(
    username: string,
    error?: string,
    relations: string[] = [],
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations,
    });

    if (!user) {
      throw new NotFoundException(error || 'User not found');
    }

    return user;
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
