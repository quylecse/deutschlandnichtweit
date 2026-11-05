import { Module } from '@nestjs/common';
import { StudienkollegService } from './studienkolleg.service.js';
import { StudienkollegController } from './studienkolleg.controller.js';
import { StudienkollegRepository } from './studienkolleg.repository.js';

@Module({
  controllers: [StudienkollegController],
  providers: [StudienkollegService, StudienkollegRepository],
  exports: [StudienkollegService, StudienkollegRepository],
})
export class StudienkollegModule { }