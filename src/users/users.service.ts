import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

import { Profile } from '@/src/profiles/entities/profile.entity';

import { QueryRunnerFactory } from '@/src/common/factories/query-runner.factory';
import { BCRYPT_SALT_ROUNDS, DEFAULT_PROFILE } from '@/src/config/constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly queryRunnerFactory: QueryRunnerFactory,
    private readonly paginationService: PaginationService,
    private readonly authService: AuthService,
  ) {}

  async findAll({
    paginationDto,
    currentUser,
  }: {
    paginationDto: PaginationDto;
    currentUser?: User;
  }) {
    const query = this.usersRepository.createQueryBuilder('user');

    this.addFollowStatus(query, currentUser);

    const { data, meta, raw } = await this.paginationService.paginate({
      query,
      ...paginationDto,
    });

    const transformedData = data.map((user) => {
      const rawItem = raw.find((item: any) => item.user_id === user.id);

      if (rawItem) {
        user.isFollowed = rawItem.user_isFollowed === 1;
      }

      return user;
    });

    return {
      data: transformedData,
      meta,
    };
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

  async findOneByIdOrFail({
    id,
    relations,
    error,
  }: {
    id: string;
    relations?: string[];
    error?: string;
  }): Promise<User> {
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

  async findOneByUsernameOrFail({
    username,
    relations,
    error,
    currentUser,
  }: {
    username: string;
    relations?: string[];
    error?: string;
    currentUser?: User;
  }): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations,
    });

    if (!user) {
      throw new NotFoundException(error || 'User not found');
    }

    const raw = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .leftJoinAndSelect('user.profile', 'profile')
      .addSelect(
        `(SELECT COUNT(*) FROM follow WHERE followingId = user.id)`,
        'followers',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM follow WHERE followerId = user.id)`,
        'following',
      )
      .addSelect(
        `(SELECT COUNT(*) > 0 FROM follow WHERE followerId = :currentUserId AND followingId = user.id)`,
        'isFollowed',
      )
      .setParameter('currentUserId', currentUser?.id)
      .getRawOne();

    user.followersCount = raw.followers;
    user.followingCount = raw.following;
    console.log('raw', raw);
    console.log(currentUser);
    user.isFollowed = raw.isFollowed === 1;

    return user;
  }

  async create(createUserDto: CreateUserDto) {
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

      const access_token = await this.authService.login(user);

      return {
        ...user,
        access_token: access_token.access_token,
      };
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

  private async addFollowStatus(
    query: SelectQueryBuilder<User>,
    currentUser?: User,
  ): Promise<void> {
    if (currentUser) {
      const currentUserId = currentUser.id;

      query
        .addSelect(
          `(SELECT COUNT(*) > 0 FROM follow WHERE followerId = :currentUserId AND followingId = "user"."id")`,
          'user_isFollowed',
        )
        .setParameter('currentUserId', currentUserId);
    } else {
      query.addSelect('0', 'user_isFollowed');
    }
  }
}
