import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MailService } from '../mail/mail.service.js';
import { PendingLinksRepository } from './pending-links.repository.js';
import { UserModule } from '../user/user.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthSessionsService } from './auth-sessions.service.js';
import { AuthSessionsRepository } from './auth-sessions.repository.js';
import { jwtConfig } from '../config/jwt.config.js';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync(jwtConfig)
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    PendingLinksRepository,
    AuthSessionsService,
    AuthSessionsRepository
  ],
  exports: [AuthService, AuthSessionsService, JwtModule],
})
export class AuthModule { }
