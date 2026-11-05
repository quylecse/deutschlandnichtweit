export interface EntranceExamInfo {
    id: string;
    studienkolleg_id: string;
    exam_date_raw: string | null;
    application_deadline: string | null;
    subjects: string[];
    courses_offered: string[];
    sample_tests_url: string | null;
    raw_summary: string | null;
    funding_type: string | null;
    partner_universities: string[];
    application_portal: string | null;
    required_documents: string[];
    application_fee: string | null;
    exam_fee: string | null;
    exam_mode: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    last_crawled_at: string;
    updated_at: string;
}

export interface Studienkolleg {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    type: string;
    website_url: string;
    crawler_url: string;
    created_at: string;
    updated_at: string;
    entrance_exam_info?: EntranceExamInfo | null;
}

export interface UpsertStudienkollegPayload {
    slug: string;
    name: string;
    city: string;
    state: string;
    type: 'UNIVERSITAET' | 'FACHHOCHSCHULE' | 'BOTH';
    website_url: string;
    crawler_url: string;
}

export interface UpsertExamInfoPayload {
    studienkolleg_id: string;
    exam_date_raw?: string | null;
    application_deadline?: string | null;
    subjects?: string[];
    courses_offered?: string[];
    sample_tests_url?: string | null;
    raw_summary?: string | null;
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
