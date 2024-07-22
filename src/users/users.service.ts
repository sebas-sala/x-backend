import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findById(id: string): Promise<User | any> {
    return this.findOnebyField('id', id);
  }

  findByEmail(email: string): Promise<User | any> {
    return this.findOnebyField('email', email);
  }

  findByUsername(username: string): Promise<User | any> {
    return this.findOnebyField('username', username);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password } = createUserDto;

    await this.validateUserDoesNotExist(username, email);

    const hashedPassword = await this.hashPassword(password);
    createUserDto.password = hashedPassword;

    const newUser = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(newUser);
  }

  private async findOnebyField(field: string, value: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ [field]: value });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltOrRounds = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, saltOrRounds);
  }

  private async validateUserDoesNotExist(
    username: string,
    email: string,
  ): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
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
