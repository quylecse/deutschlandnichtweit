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
    last_crawled_at: string | null;
}

export interface Studienkolleg {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    type: 'UNIVERSITAET' | 'FACHHOCHSCHULE' | 'BOTH' | string;
    website_url: string;
    crawler_url: string;
    entrance_exam_info: EntranceExamInfo | null;
}
