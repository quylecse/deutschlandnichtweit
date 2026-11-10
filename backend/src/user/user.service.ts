import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { User, UserWithPassword } from './types/user.interface.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UsersRepository) { }

  async createUser(email: string, passwordHash?: string | null): Promise<User> {
    const existingUser = await this.userRepo.findByEmailWithPassword(email);
    if (existingUser) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }
    return await this.userRepo.create(email, passwordHash);
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | null> {
    if (!email) {
      return null;
    }
    return await this.userRepo.findByEmailWithPassword(email);
  }

  async removeAccount(userId: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('USER_ID_REQUIRED');
    }
    await this.userRepo.deleteById(userId);
  }

  async verifyEmail(userId: string): Promise<User> {
    if (!userId) {
      throw new BadRequestException('USER_ID_REQUIRED');
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    if (user.emailVerified) {
      throw new BadRequestException('EMAIL_ALREADY_VERIFIED');
    }

    return await this.userRepo.markEmailVerified(userId);
  }

  async findById(userId: string): Promise<User | null> {
    if (!userId) {
      return null;
    }
    return await this.userRepo.findById(userId);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('USER_ID_REQUIRED');
    }
    await this.userRepo.updatePassword(userId, passwordHash);
  }
}
