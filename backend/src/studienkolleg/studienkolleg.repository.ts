import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
    EntranceExamInfo,
    Studienkolleg,
    UpsertExamInfoPayload,
    UpsertStudienkollegPayload,
} from './studienkolleg.interfaces.js';

const META_START_TAG = '\n<!--STK_EXT_META:';
const META_END_TAG = ':END_STK_EXT_META-->';

interface ExtendedExamMeta {
    funding_type?: string | null;
    partner_universities?: string[];
    application_portal?: string | null;
    required_documents?: string[];
    application_fee?: string | null;
    exam_fee?: string | null;
    exam_mode?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
}

@Injectable()
export class StudienkollegRepository {
    private readonly logger = new Logger(StudienkollegRepository.name);

    constructor(private readonly supabase: SupabaseService) {}

    private packExtendedMeta(payload: UpsertExamInfoPayload): string | null {
        const cleanSummary = (payload.raw_summary ?? '').split(META_START_TAG)[0].trim();
        const meta: ExtendedExamMeta = {
            funding_type: payload.funding_type ?? null,
            partner_universities: payload.partner_universities ?? [],
            application_portal: payload.application_portal ?? null,
            required_documents: payload.required_documents ?? [],
            application_fee: payload.application_fee ?? null,
            exam_fee: payload.exam_fee ?? null,
            exam_mode: payload.exam_mode ?? null,
            contact_email: payload.contact_email ?? null,
            contact_phone: payload.contact_phone ?? null,
        };
        return `${cleanSummary}${META_START_TAG}${JSON.stringify(meta)}${META_END_TAG}`;
    }

    private normalizeExamInfo(exam: any): EntranceExamInfo | null {
        if (!exam) return null;

        let rawSummary: string | null = exam.raw_summary ?? null;
        let parsedMeta: ExtendedExamMeta = {};

        if (rawSummary && rawSummary.includes(META_START_TAG)) {
            const startIdx = rawSummary.indexOf(META_START_TAG);
            const endIdx = rawSummary.indexOf(META_END_TAG, startIdx);
            if (endIdx !== -1) {
                const jsonPart = rawSummary.slice(
                    startIdx + META_START_TAG.length,
                    endIdx,
                );
                try {
                    parsedMeta = JSON.parse(jsonPart) as ExtendedExamMeta;
                } catch {
                    // Ignore malformed metadata
                }
            }
            rawSummary = rawSummary.slice(0, startIdx).trim();
        }

        return {
            ...exam,
            raw_summary: rawSummary,
            funding_type: exam.funding_type || parsedMeta.funding_type || null,
            partner_universities:
                Array.isArray(exam.partner_universities) &&
                exam.partner_universities.length > 0
                    ? exam.partner_universities
                    : Array.isArray(parsedMeta.partner_universities)
                      ? parsedMeta.partner_universities
                      : [],
            application_portal:
                exam.application_portal || parsedMeta.application_portal || null,
            required_documents:
                Array.isArray(exam.required_documents) &&
                exam.required_documents.length > 0
                    ? exam.required_documents
                    : Array.isArray(parsedMeta.required_documents)
                      ? parsedMeta.required_documents
                      : [],
            application_fee:
                exam.application_fee || parsedMeta.application_fee || null,
            exam_fee: exam.exam_fee || parsedMeta.exam_fee || null,
            exam_mode: exam.exam_mode || parsedMeta.exam_mode || null,
            contact_email: exam.contact_email || parsedMeta.contact_email || null,
            contact_phone: exam.contact_phone || parsedMeta.contact_phone || null,
        };
    }

    private normalizeSchool(school: any): Studienkolleg {
        const rawExam = Array.isArray(school.entrance_exam_info)
            ? school.entrance_exam_info[0] ?? null
            : school.entrance_exam_info ?? null;

        return {
            ...school,
            entrance_exam_info: this.normalizeExamInfo(rawExam),
        };
    }

    async findAll(): Promise<Studienkolleg[]> {
        const { data, error } = await this.supabase.client
            .from('studienkollegs')
            .select(
                `
        *,
        entrance_exam_info (*)
      `,
            )
            .order('name', { ascending: true });

        if (error) {
            this.logger.error(`Failed to fetch studienkollegs: ${error.message}`);
            throw error;
        }

        return ((data as any[]) ?? []).map((item) => this.normalizeSchool(item));
    }

    async findBySlug(slug: string): Promise<Studienkolleg | null> {
        const { data, error } = await this.supabase.client
            .from('studienkollegs')
            .select(
                `
        *,
        entrance_exam_info (*)
      `,
            )
            .eq('slug', slug)
            .maybeSingle();

        if (error) {
            this.logger.error(
                `Failed to fetch studienkolleg by slug (${slug}): ${error.message}`,
            );
            throw error;
        }

        return data ? this.normalizeSchool(data) : null;
    }

    async upsertSchools(
        schools: UpsertStudienkollegPayload[],
    ): Promise<Studienkolleg[]> {
        const now = new Date().toISOString();
        const rows = schools.map((s) => ({
            ...s,
            updated_at: now,
        }));

        const { data, error } = await this.supabase.client
            .from('studienkollegs')
            .upsert(rows, { onConflict: 'slug' })
            .select('*, entrance_exam_info (*)');

        if (error) {
            this.logger.error(
                `Failed to upsert studienkollegs list: ${error.message}`,
            );
            throw error;
        }

        return ((data as any[]) ?? []).map((item) =>
            this.normalizeSchool(item),
        );
    }

    async upsertExamInfo(payload: UpsertExamInfoPayload): Promise<EntranceExamInfo> {
        const now = new Date().toISOString();

        // Try upserting with all columns first (if migration was applied)
        const { data, error } = await this.supabase.client
            .from('entrance_exam_info')
            .upsert(
                {
                    ...payload,
                    last_crawled_at: now,
                    updated_at: now,
                },
                { onConflict: 'studienkolleg_id' },
            )
            .select()
            .single();

        if (!error && data) {
            return this.normalizeExamInfo(data)!;
        }

        // Fallback if new columns haven't been created in Supabase table yet
        if (
            error &&
            (error.code === 'PGRST204' ||
                error.message?.includes('column') ||
                error.message?.includes('schema cache'))
        ) {
            this.logger.warn(
                `Extended columns not found in entrance_exam_info table (${error.message}). Saving with embedded metadata fallback.`,
            );

            const legacyPayload = {
                studienkolleg_id: payload.studienkolleg_id,
                exam_date_raw: payload.exam_date_raw ?? null,
                application_deadline: payload.application_deadline ?? null,
                subjects: payload.subjects ?? [],
                courses_offered: payload.courses_offered ?? [],
                sample_tests_url: payload.sample_tests_url ?? null,
                raw_summary: this.packExtendedMeta(payload),
                last_crawled_at: now,
                updated_at: now,
            };

            const fallbackResult = await this.supabase.client
                .from('entrance_exam_info')
                .upsert(legacyPayload, { onConflict: 'studienkolleg_id' })
                .select()
                .single();

            if (fallbackResult.error) {
                this.logger.error(
                    `Failed to upsert exam info (fallback) for studienkolleg_id (${payload.studienkolleg_id}): ${fallbackResult.error.message}`,
                );
                throw fallbackResult.error;
            }

            return this.normalizeExamInfo(fallbackResult.data)!;
        }

        this.logger.error(
            `Failed to upsert exam info for studienkolleg_id (${payload.studienkolleg_id}): ${error?.message}`,
        );
        throw error;
    }
}
