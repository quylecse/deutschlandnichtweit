import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UsersRepository } from './users.repository.js';

@Module({
  providers: [UserService, UsersRepository],
  exports: [UserService, UsersRepository],
})
export class UserModule {}
