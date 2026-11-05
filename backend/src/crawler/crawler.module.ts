import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service.js';
import { CrawlerController } from './crawler.controller.js';
import { StudienkollegModule } from '../studienkolleg/studienkolleg.module.js';

@Module({
  imports: [StudienkollegModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule { }