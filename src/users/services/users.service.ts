import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    let user = await this.usersRepository.findByEmail(email);

    if (!user) {
      this.logger.log(`User with email ${email} not found, creating new user`);
      user = await this.usersRepository.create({ email });
    }

    return user;
  }
}
