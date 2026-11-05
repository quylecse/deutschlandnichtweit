import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { StudienkollegRepository } from './studienkolleg.repository.js';
import { Studienkolleg } from './studienkolleg.interfaces.js';

@Injectable()
export class StudienkollegService {
    constructor(private readonly stkRepository: StudienkollegRepository) { }

    async findAll(): Promise<Studienkolleg[]> {
        try {
            return await this.stkRepository.findAll();
        } catch {
            throw new InternalServerErrorException(
                'Failed to retrieve Studienkollegs list',
            );
        }
    }

    async findBySlug(slug: string): Promise<Studienkolleg> {
        const studienkolleg = await this.stkRepository.findBySlug(slug);
        if (!studienkolleg) {
            throw new NotFoundException(
                `Studienkolleg with slug "${slug}" was not found`,
            );
        }
        return studienkolleg;
    }
}