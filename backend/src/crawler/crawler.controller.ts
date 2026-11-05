import { Controller, Param, Post, Query } from '@nestjs/common';
import { CrawlerService } from './crawler.service.js';

@Controller('crawler')
export class CrawlerController {
    constructor(private readonly crawlerService: CrawlerService) {}

    @Post('seed')
    seedCatalog() {
        return this.crawlerService.seedCatalog();
    }

    @Post('sync')
    syncAll(@Query('onlyMissing') onlyMissing?: string) {
        return this.crawlerService.crawlAll(onlyMissing === 'true');
    }

    @Post('sync/:slug')
    syncBySlug(@Param('slug') slug: string) {
        return this.crawlerService.crawlBySlug(slug);
    }
}
