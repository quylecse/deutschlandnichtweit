import { Controller, Get, Param } from '@nestjs/common';
import { StudienkollegService } from './studienkolleg.service.js';

@Controller('studienkollegs')
export class StudienkollegController {
    constructor(private readonly stkService: StudienkollegService) { }

    @Get()
    getAll() {
        return this.stkService.findAll();
    }

    @Get(':slug')
    getBySlug(@Param('slug') slug: string) {
        return this.stkService.findBySlug(slug);
    }
}