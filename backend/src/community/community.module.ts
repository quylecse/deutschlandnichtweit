import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';
import { CommunityRepository } from './community.repository.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityRepository],
  exports: [CommunityService, CommunityRepository],
})
export class CommunityModule {}
