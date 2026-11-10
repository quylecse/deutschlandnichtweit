import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractText } from 'unpdf';
import { StudienkollegRepository } from '../studienkolleg/studienkolleg.repository.js';
import {
    Studienkolleg,
    UpsertExamInfoPayload,
} from '../studienkolleg/studienkolleg.interfaces.js';
import { STUDIENKOLLEG_SEED_DATA } from '../supabase/studienkolleg-seed.js';

interface ExtractedExamJson {
    funding_type: string | null;
    partner_universities: string[];
    exam_date_raw: string | null;
    application_deadline: string | null;
    subjects: string[];
    courses_offered: string[];
    application_portal: string | null;
    required_documents: string[];
    application_fee: string | null;
    exam_fee: string | null;
    exam_mode: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    sample_tests_url: string | null;
    raw_summary: string | null;
}

interface DiscoveredLink {
    url: string;
    text: string;
    isPdf: boolean;
    score: number;
}

interface ParsedPageResult {
    url: string;
    text: string;
    links: DiscoveredLink[];
    emails: string[];
    phones: string[];
}

@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);
    private readonly geminiApiKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly stkRepository: StudienkollegRepository,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY in environment variables');
        }
        this.geminiApiKey = apiKey;
    }

    private normalizeUrl(href: string, baseUrl: string): string | null {
        try {
            const parsed = new URL(href, baseUrl);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return null;
            }
            parsed.hash = '';
            return parsed.toString();
        } catch {
            return null;
        }
    }

    private isPdfUrl(url: string, linkText: string): boolean {
        const lowerUrl = url.toLowerCase();
        const lowerText = linkText.toLowerCase();
        return (
            lowerUrl.endsWith('.pdf') ||
            lowerUrl.includes('.pdf?') ||
            (lowerUrl.includes('download') && lowerText.includes('pdf'))
        );
    }

    private getRootDomain(hostname: string): string {
        const clean = hostname.toLowerCase().replace(/^www\./, '');
        const parts = clean.split('.');
        if (parts.length <= 2) return clean;
        return parts.slice(-2).join('.');
    }

    private scoreLink(
        targetUrl: string,
        linkText: string,
        baseUrls: string[],
    ): number {
        const combined = `${targetUrl} ${linkText}`.toLowerCase();

        // Exclude irrelevant pages
        const negativeKeywords = [
            'impressum',
            'datenschutz',
            'privacy',
            'barrierefreiheit',
            'stellenangebot',
            'karriere',
            'presse',
            'login',
            'intranet',
            'mensa',
            'hochschulsport',
            'bibliothek',
            'sitemap',
            'alumni',
            'facebook.com',
            'instagram.com',
            'youtube.com',
            'linkedin.com',
            'twitter.com',
            'tiktok.com',
        ];
        if (negativeKeywords.some((kw) => combined.includes(kw))) {
            return -20;
        }

        let score = 0;

        // High priority keywords for Studienkolleg admission, exam dates, German level, fees, documents, partners, contact
        const highPriority = [
            'studienkolleg',
            'aufnahmetest',
            'aufnahmepruefung',
            'aufnahmeprüfung',
            'einstufungstest',
            'aufnahme',
            'bewerbung',
            'bewerben',
            'zulassung',
            'voraussetzung',
            'sprachkenntnis',
            'deutschkenntnis',
            'sprachnachweis',
            'zertifikat',
            'merkblatt',
            'uni-assist',
            'uniassist',
            'partnerhochschul',
            'kooperationshochschul',
            'hochschulen',
            'universitaet',
            'universität',
            'gebuehr',
            'gebühr',
            'kosten',
            'entgelt',
            'kontakt',
            'ansprechpartner',
            'unterlagen',
            'dokument',
            'termin',
            'frist',
            'zeitplan',
            'pruefungstermin',
            'prüfungstermin',
        ];
        for (const kw of highPriority) {
            if (combined.includes(kw)) score += 5;
        }

        // Medium priority keywords
        const mediumPriority = [
            'kurs',
            't-kurs',
            'm-kurs',
            'w-kurs',
            'g-kurs',
            's-kurs',
            'fachkurs',
            'muster',
            'beispiel',
            'uebung',
            'übung',
            'pruefung',
            'prüfung',
            'faq',
            'online',
            'praesenz',
            'präsenz',
            'ablauf',
            'wintersemester',
            'sommersemester',
            'application',
            'admission',
            'entrance',
            'contact',
            'fee',
        ];
        for (const kw of mediumPriority) {
            if (combined.includes(kw)) score += 3;
        }

        // Boost if URL shares hostname/root-domain or path prefix with school's website_url or crawler_url
        for (const base of baseUrls) {
            try {
                const baseObj = new URL(base);
                const targetObj = new URL(targetUrl);
                if (targetObj.hostname === baseObj.hostname) {
                    score += 3;
                    const basePath = baseObj.pathname.replace(/\/$/, '');
                    if (
                        basePath.length > 1 &&
                        targetObj.pathname.startsWith(basePath)
                    ) {
                        score += 6;
                    }
                } else if (
                    this.getRootDomain(targetObj.hostname) ===
                    this.getRootDomain(baseObj.hostname)
                ) {
                    score += 2;
                }
            } catch {
                // Ignore URL parse errors
            }
        }

        return score;
    }

    private extractContactsFromHtml($: cheerio.CheerioAPI): {
        emails: string[];
        phones: string[];
    } {
        const emails = new Set<string>();
        const phones = new Set<string>();

        $('a[href^="mailto:"]').each((_, el) => {
            const raw = $(el).attr('href')?.replace(/^mailto:/i, '').split('?')[0]?.trim();
            if (raw && raw.includes('@')) emails.add(raw);
        });

        $('a[href^="tel:"]').each((_, el) => {
            const raw = $(el).attr('href')?.replace(/^tel:/i, '').trim();
            if (raw && raw.length >= 6) phones.add(raw);
        });

        const contactAreasText = $(
            'footer, aside, address, [class*="contact"], [class*="kontakt"], [id*="contact"], [id*="kontakt"], main, body',
        )
            .text()
            .replace(/\s+/g, ' ');

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matchedEmails = contactAreasText.match(emailRegex) || [];
        for (const em of matchedEmails) {
            if (
                !em.endsWith('.png') &&
                !em.endsWith('.jpg') &&
                !em.endsWith('.svg') &&
                !em.includes('example.')
            ) {
                emails.add(em);
            }
        }

        const phoneRegex =
            /(?:\+49|0049|Tel\.?:?\s*0|Telefon:?\s*0|\b0)[0-9\s/\-()]{7,22}/gi;
        const matchedPhones = contactAreasText.match(phoneRegex) || [];
        for (const ph of matchedPhones) {
            const cleaned = ph.replace(/^(Tel\.?:?|Telefon:?)\s*/i, '').trim();
            if (cleaned.replace(/\D/g, '').length >= 7) {
                phones.add(cleaned);
            }
        }

        return {
            emails: Array.from(emails).slice(0, 6),
            phones: Array.from(phones).slice(0, 6),
        };
    }

    private async fetchHtmlPage(
        url: string,
        baseUrls: string[],
    ): Promise<ParsedPageResult | null> {
        try {
            const response = await axios.get<string>(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                },
                timeout: 15000,
                responseType: 'text',
            });

            if (typeof response.data !== 'string') {
                return null;
            }

            const $ = cheerio.load(response.data);

            // 1. Extract contacts BEFORE removing footer/aside
            const { emails, phones } = this.extractContactsFromHtml($);

            // 2. Extract contact blocks in footer/aside so we don't lose address/phone/email
            const contactBlockText = $(
                'address, [class*="kontakt"], [class*="contact"], footer',
            )
                .text()
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 1500);

            // 3. Collect all links on the page (supporting same root domain & subdomains)
            const linksMap = new Map<string, DiscoveredLink>();
            const baseRootDomains = new Set<string>();
            for (const b of baseUrls) {
                try {
                    baseRootDomains.add(this.getRootDomain(new URL(b).hostname));
                } catch {
                    // ignore
                }
            }

            $('a[href]').each((_, el) => {
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                const href = $(el).attr('href');
                if (
                    !href ||
                    href.startsWith('#') ||
                    href.startsWith('javascript:') ||
                    href.startsWith('mailto:') ||
                    href.startsWith('tel:')
                ) {
                    return;
                }

                const fullUrl = this.normalizeUrl(href, url);
                if (!fullUrl) return;

                const isPdf = this.isPdfUrl(fullUrl, text);
                let isSameDomain = false;
                try {
                    const rootHost = this.getRootDomain(new URL(fullUrl).hostname);
                    isSameDomain = baseRootDomains.has(rootHost);
                } catch {
                    isSameDomain = false;
                }

                if (!isPdf && !isSameDomain) return;

                const score = this.scoreLink(fullUrl, text, baseUrls);
                if (score < 0) return;

                const existing = linksMap.get(fullUrl);
                if (!existing || score > existing.score) {
                    linksMap.set(fullUrl, {
                        url: fullUrl,
                        text: text || 'Link',
                        isPdf,
                        score,
                    });
                }
            });

            // 4. Clean non-content tags and extract full main text (avoid .first() bug across multiple articles)
            $('script, style, noscript, svg, nav').remove();

            let bodyText = $('main, #content, #main').text().replace(/\s+/g, ' ').trim();
            if (bodyText.length < 400) {
                bodyText = $('body').text().replace(/\s+/g, ' ').trim();
            }

            const combinedText = contactBlockText
                ? `${bodyText.slice(0, 10000)}\n[THÔNG TIN LIÊN HỆ / FOOTER]: ${contactBlockText}`
                : bodyText.slice(0, 11000);

            return {
                url,
                text: combinedText,
                links: Array.from(linksMap.values()),
                emails,
                phones,
            };
        } catch (error) {
            this.logger.warn(
                `Failed to fetch HTML from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return null;
        }
    }

    private async fetchPdfContent(pdfUrl: string): Promise<string | null> {
        try {
            this.logger.log(`Downloading and parsing PDF: ${pdfUrl}`);
            const response = await axios.get<ArrayBuffer>(pdfUrl, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                },
                responseType: 'arraybuffer',
                timeout: 15000,
                maxContentLength: 10 * 1024 * 1024, // 10MB max
            });

            const uint8 = new Uint8Array(response.data);
            const { text } = await extractText(uint8, { mergePages: true });
            const cleaned = (text || '').replace(/\s+/g, ' ').trim();
            if (!cleaned) return null;

            return `=== NỘI DUNG FILE PDF (${pdfUrl}) ===\n${cleaned.slice(0, 8500)}`;
        } catch (error) {
            this.logger.warn(
                `Failed to parse PDF from ${pdfUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return null;
        }
    }

    private async buildComprehensiveContext(stk: Studienkolleg): Promise<string> {
        const baseUrls = Array.from(
            new Set([stk.crawler_url, stk.website_url].filter(Boolean)),
        );
        const visitedUrls = new Set<string>();
        const allDiscoveredLinks = new Map<string, DiscoveredLink>();
        const allEmails = new Set<string>();
        const allPhones = new Set<string>();
        const pageSections: string[] = [];

        // 1. Crawl primary URLs (crawler_url and website_url if different)
        for (const startUrl of baseUrls) {
            const normalized = this.normalizeUrl(startUrl, startUrl) || startUrl;
            if (visitedUrls.has(normalized)) continue;
            visitedUrls.add(normalized);

            // Check if the starting crawler_url itself is a PDF
            if (this.isPdfUrl(normalized, '')) {
                const pdfText = await this.fetchPdfContent(normalized);
                if (pdfText) pageSections.push(pdfText);
                continue;
            }

            const page = await this.fetchHtmlPage(normalized, baseUrls);
            if (!page) continue;

            pageSections.push(
                `=== TRANG CHÍNH (${page.url}) ===\n${page.text}`,
            );
            page.emails.forEach((e) => allEmails.add(e));
            page.phones.forEach((p) => allPhones.add(p));
            for (const link of page.links) {
                const existing = allDiscoveredLinks.get(link.url);
                if (!existing || link.score > existing.score) {
                    allDiscoveredLinks.set(link.url, link);
                }
            }
        }

        // 2. DEPTH 1: Select up to 6 top-scoring sub-pages from primary pages
        const depth1Candidates = Array.from(allDiscoveredLinks.values())
            .filter((l) => !l.isPdf && !visitedUrls.has(l.url) && l.score >= 4)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);

        if (depth1Candidates.length > 0) {
            this.logger.log(
                `[Depth 1] Following ${depth1Candidates.length} sub-links for ${stk.slug}: ${depth1Candidates.map((c) => c.url).join(', ')}`,
            );
            for (const sub of depth1Candidates) {
                visitedUrls.add(sub.url);
            }

            const subResults = await Promise.allSettled(
                depth1Candidates.map((sub) =>
                    this.fetchHtmlPage(sub.url, baseUrls),
                ),
            );

            for (const res of subResults) {
                if (res.status === 'fulfilled' && res.value) {
                    const page = res.value;
                    pageSections.push(
                        `=== TRANG PHỤ TẦNG 1 (${page.url}) ===\n${page.text.slice(0, 7000)}`,
                    );
                    page.emails.forEach((e) => allEmails.add(e));
                    page.phones.forEach((p) => allPhones.add(p));
                    for (const link of page.links) {
                        const existing = allDiscoveredLinks.get(link.url);
                        if (!existing || link.score > existing.score) {
                            allDiscoveredLinks.set(link.url, link);
                        }
                    }
                }
            }
        }

        // 3. DEPTH 2: Follow up to 5 deeper links specifically targeting exam dates, German level, fees, or admission rules
        const depth2Candidates = Array.from(allDiscoveredLinks.values())
            .filter((l) => {
                if (l.isPdf || visitedUrls.has(l.url) || l.score < 6) return false;
                const combined = `${l.url} ${l.text}`.toLowerCase();
                return /termin|frist|aufnahm|pruefung|prüfung|test|sprach|deutsch|voraussetzung|bewerb|zulassung|gebühr|gebuehr|kosten/i.test(
                    combined,
                );
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (depth2Candidates.length > 0) {
            this.logger.log(
                `[Depth 2] Following ${depth2Candidates.length} deep sub-links for ${stk.slug}: ${depth2Candidates.map((c) => c.url).join(', ')}`,
            );
            for (const sub of depth2Candidates) {
                visitedUrls.add(sub.url);
            }

            const depth2Results = await Promise.allSettled(
                depth2Candidates.map((sub) =>
                    this.fetchHtmlPage(sub.url, baseUrls),
                ),
            );

            for (const res of depth2Results) {
                if (res.status === 'fulfilled' && res.value) {
                    const page = res.value;
                    pageSections.push(
                        `=== TRANG PHỤ TẦNG 2 (${page.url}) ===\n${page.text.slice(0, 6500)}`,
                    );
                    page.emails.forEach((e) => allEmails.add(e));
                    page.phones.forEach((p) => allPhones.add(p));
                    for (const link of page.links) {
                        const existing = allDiscoveredLinks.get(link.url);
                        if (!existing || link.score > existing.score) {
                            allDiscoveredLinks.set(link.url, link);
                        }
                    }
                }
            }
        }

        // 4. Select up to 4 top-scoring PDF files to read
        const candidatePdfs = Array.from(allDiscoveredLinks.values())
            .filter((l) => l.isPdf && !visitedUrls.has(l.url))
            .sort((a, b) => {
                const aInfo = /merkblatt|info|bewerb|aufnahm|zulassung|termin|frist|sprach|gebühr|ordnung|faq/i.test(
                    `${a.url} ${a.text}`,
                )
                    ? 12
                    : 0;
                const bInfo = /merkblatt|info|bewerb|aufnahm|zulassung|termin|frist|sprach|gebühr|ordnung|faq/i.test(
                    `${b.url} ${b.text}`,
                )
                    ? 12
                    : 0;
                return b.score + bInfo - (a.score + aInfo);
            })
            .slice(0, 4);

        if (candidatePdfs.length > 0) {
            this.logger.log(
                `Reading ${candidatePdfs.length} PDF files for ${stk.slug}: ${candidatePdfs.map((p) => p.url).join(', ')}`,
            );
            const pdfResults = await Promise.allSettled(
                candidatePdfs.map((pdf) => this.fetchPdfContent(pdf.url)),
            );
            for (const res of pdfResults) {
                if (res.status === 'fulfilled' && res.value) {
                    pageSections.push(res.value);
                }
            }
        }

        const formattedLinks = Array.from(allDiscoveredLinks.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 60)
            .map((l) => `- [${l.text}](${l.url})${l.isPdf ? ' [PDF]' : ''}`)
            .join('\n');

        return [
            `=== THÔNG TIN TRƯỜNG CƠ BẢN ===`,
            `Tên trường: ${stk.name}`,
            `Thành phố: ${stk.city} | Bang: ${stk.state} | Hệ: ${stk.type}`,
            `Website chính: ${stk.website_url}`,
            `URL tuyển sinh: ${stk.crawler_url}`,
            `Email phát hiện trên trang: ${Array.from(allEmails).join(', ') || 'Chưa rõ'}`,
            `Số điện thoại phát hiện trên trang: ${Array.from(allPhones).join(', ') || 'Chưa rõ'}`,
            ``,
            `=== DANH SÁCH LINKS & PDF TRÊN TRANG ===`,
            formattedLinks,
            ``,
            `=== NỘI DUNG CÁC TRANG WEB & FILE PDF ĐÃ ĐỌC ===`,
            pageSections.join('\n\n'),
        ]
            .join('\n')
            .slice(0, 65000);
    }

    private async extractWithAi(
        stk: Studienkolleg,
        pageContent: string,
        retries = 3,
        delay = 5000,
    ): Promise<ExtractedExamJson> {
        if (!pageContent || pageContent.trim().length < 50) {
            return {
                funding_type: 'Chưa có thông tin',
                partner_universities: [],
                exam_date_raw: 'Chưa có thông tin',
                application_deadline: 'Chưa có thông tin',
                subjects: [],
                courses_offered: [],
                application_portal: 'Chưa có thông tin',
                required_documents: [],
                application_fee: 'Chưa có thông tin',
                exam_fee: 'Miễn phí',
                exam_mode: 'Chưa có thông tin',
                contact_email: null,
                contact_phone: null,
                sample_tests_url: null,
                raw_summary:
                    'Không thể truy cập hoặc trích xuất nội dung từ trang web chính thức của trường.',
            };
        }

        const endpoint =
            'https://generativelanguage.googleapis.com/v1beta/interactions';

        const prompt = `Bạn là chuyên gia phân tích dữ liệu tuyển sinh các trường Dự bị Đại học Đức (Studienkolleg).
Hãy phân tích toàn bộ nội dung trang web chính, các trang phụ (Tầng 1 & Tầng 2) và nội dung file PDF được cung cấp dưới đây của trường "${stk.name}" (${stk.city}, bang ${stk.state}) để trích xuất đầy đủ, chính xác các thông tin phục vụ học sinh Việt Nam.

QUY TẮC BẮT BUỘC:
1. TẤT CẢ nội dung mô tả trả về PHẢI BẰNG TIẾNG VIỆT rõ ràng, tự nhiên, chính xác.
2. Không tự bịa đặt số liệu ngày tháng hay lệ phí nếu không được đề cập. Tuy nhiên:
   - Với "funding_type": Xác định rõ là "Công lập (Staatlich)" hay "Tư nhân (Privat)" dựa vào tên trường (Staatliches Studienkolleg / thuộc đại học công lập vs. tư thục) và nội dung trang.
   - Với "partner_universities": Liệt kê danh sách tên các trường Đại học / Đại học Khoa học Ứng dụng (Universität / Technische Universität / Hochschule / Fachhochschule) liên kết hoặc trực thuộc Studienkolleg này.
   - Với "exam_date_raw" và "application_deadline": Đọc kỹ các trang phụ và PDF để tìm lịch thi Aufnahmetest và hạn nộp hồ sơ. Nếu có ngày tháng cụ thể, BẮT BUỘC giữ định dạng ngày DD.MM.YYYY kèm ký hiệu kỳ học "(WiSe)" cho kỳ Đông hoặc "(SoSe)" cho kỳ Hè (ví dụ: "13.06.2026 (WiSe), 16.01.2027 (SoSe)" hoặc "15.07. (WiSe), 15.01. (SoSe)"). Nếu hạn nộp phụ thuộc vào từng trường đại học đối tác, hãy ghi rõ bằng tiếng Việt. Nếu hoàn toàn không có thông tin, trả về "Chưa có thông tin".
   - Với "courses_offered": Chuẩn hóa mã khối học thành dạng ["T-Kurs", "M-Kurs", "W-Kurs", "G-Kurs", "S-Kurs"] (hoặc mã khối đặc thù của FH như "TI-Kurs", "WW-Kurs", "GD-Kurs", "SW-Kurs" nếu trường dùng hệ FH).
   - Với "subjects": Trả về danh sách môn thi đầu vào bằng tiếng Việt (ví dụ: ["Tiếng Đức (C-Test)", "Toán học", "Vật lý", "Hóa học", "Sinh học"]).
   - Với "application_portal": Giải thích rõ bằng tiếng Việt cách thức nộp hồ sơ đăng ký theo từng bước (1. ..., 2. ...): nộp qua cổng Uni-Assist, nộp trực tiếp qua Portal riêng của trường, hay phải nộp hồ sơ qua một trường Đại học liên kết để xin thư mời dự thi (Zulassung zum Aufnahmetest).
   - Với "required_documents": Danh sách các tài liệu/hồ sơ cần nộp khi đăng ký bằng tiếng Việt. Mục đầu tiên BẮT BUỘC nêu rõ điều kiện trình độ tiếng Đức đầu vào tối thiểu (B1 hay B2) và các chứng chỉ được chấp nhận (ví dụ: "Chứng chỉ tiếng Đức tối thiểu B1/B2 (Goethe, telc, ÖSD, DSD, TestDaF)").
   - Với "application_fee": Thông tin về lệ phí nộp và xử lý hồ sơ bằng tiếng Việt (ví dụ: phí xử lý qua Uni-Assist 75 EUR / 30 EUR, phí xét duyệt của trường, hoặc "Miễn phí xử lý tại trường").
   - Với "exam_fee": CHỈ ghi lệ phí dự thi kỳ thi đầu vào Aufnahmetest (Aufnahmeprüfungsgebühr).
     + Nếu trường không thu lệ phí dự thi Aufnahmetest (hầu hết các trường Studienkolleg công lập như TU Berlin, Zittau/Görlitz, Leipzig... đều miễn phí thi), BẮT BUỘC trả về đúng cụm từ: "Miễn phí".
     + TUYỆT ĐỐI KHÔNG đưa Semesterbeitrag (phí học kỳ/đóng góp sinh viên ~200-350 EUR đóng khi nhập học) hoặc phí xử lý hồ sơ Uni-Assist vào trường "exam_fee". (Thông tin Semesterbeitrag chỉ được viết trong phần "raw_summary").
     + Chỉ khi trường thực sự thu phí dự thi Aufnahmetest (ví dụ: "50 EUR" hoặc "100 EUR") thì mới ghi số tiền.
   - Với "exam_mode": Ghi rõ hình thức thi bằng tiếng Việt: "Tại chỗ" (nếu thi trực tiếp Präsenz tại trường/tại Đức), "Online" (nếu thi trực tuyến từ xa), hoặc "Online & Tại chỗ" kèm chi tiết ngắn gọn.
   - Với "contact_email" và "contact_phone": Trích xuất địa chỉ email và số điện thoại liên hệ chính thức của Studienkolleg (trả về null nếu không tìm thấy).
   - Với "sample_tests_url": Đường dẫn URL đầy đủ dẫn tới trang hoặc file PDF đề thi mẫu (Aufnahmetest Muster / Beispieltest) nếu có, hoặc null.
   - Với "raw_summary": Viết một bản tổng hợp chi tiết bằng tiếng Việt được chia thành 3–4 đoạn văn ngắn (phân tách nhau bằng ký tự xuống dòng \\n\\n) theo các ý: (1) Tổng quan trường & các khối đào tạo, (2) Điều kiện tiếng Đức đầu vào & quy trình nộp hồ sơ, (3) Cấu trúc, lịch thi và hình thức bài thi Aufnahmetest, (4) Lệ phí dự thi, phí học kỳ (Semesterbeitrag) và lưu ý quan trọng.

BẠN PHẢI TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ theo đúng cấu trúc sau (không dùng markdown block, không thêm văn bản ngoài JSON):
{
  "funding_type": "Công lập (Staatlich) hoặc Tư nhân (Privat)",
  "partner_universities": ["Tên trường ĐH liên kết 1", "Tên trường ĐH liên kết 2"],
  "exam_date_raw": "string hoặc 'Chưa có thông tin'",
  "application_deadline": "string hoặc 'Chưa có thông tin'",
  "subjects": ["Môn thi bằng tiếng Việt"],
  "courses_offered": ["T-Kurs", "M-Kurs", "W-Kurs", "G-Kurs", "S-Kurs"],
  "application_portal": "Mô tả chi tiết cổng/cách nộp hồ sơ bằng tiếng Việt",
  "required_documents": ["Chứng chỉ tiếng Đức tối thiểu B1/B2...", "Tài liệu 2 bằng tiếng Việt"],
  "application_fee": "Thông tin lệ phí nộp/xử lý hồ sơ bằng tiếng Việt",
  "exam_fee": "'Miễn phí' hoặc mức lệ phí dự thi Aufnahmetest cụ thể (tuyệt đối không ghi Semesterbeitrag ở đây)",
  "exam_mode": "Hình thức thi (Tại chỗ / Online) bằng tiếng Việt",
  "contact_email": "string hoặc null",
  "contact_phone": "string hoặc null",
  "sample_tests_url": "string hoặc null",
  "raw_summary": "Tóm tắt chi tiết toàn bộ thông tin tuyển sinh bằng tiếng Việt"
}

Dữ liệu thu thập được từ trang web và PDF của trường:
${pageContent}`;

        const fallbackModels = [
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3-flash-preview',
        ];

        for (let i = 0; i < fallbackModels.length; i++) {
            const currentModel = fallbackModels[i];
            try {
                const response = await axios.post(
                    endpoint,
                    {
                        model: currentModel,
                        input: prompt,
                    },
                    {
                        headers: {
                            'x-goog-api-key': this.geminiApiKey,
                            'Content-Type': 'application/json',
                        },
                        timeout: 60000,
                    },
                );

                const modelOutputStep = response.data?.steps?.find(
                    (step: any) => step.type === 'model_output',
                );

                const outputText =
                    modelOutputStep?.content?.[0]?.text ||
                    response.data?.output ||
                    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                    response.data?.text;

                if (!outputText) {
                    throw new Error(
                        `Invalid response from Interactions API: ${JSON.stringify(response.data)}`,
                    );
                }

                const cleanJsonStr = outputText
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();

                const parsed = JSON.parse(cleanJsonStr) as ExtractedExamJson;

                return {
                    funding_type: parsed.funding_type || 'Chưa có thông tin',
                    partner_universities: Array.isArray(
                        parsed.partner_universities,
                    )
                        ? parsed.partner_universities
                        : [],
                    exam_date_raw: parsed.exam_date_raw || 'Chưa có thông tin',
                    application_deadline:
                        parsed.application_deadline || 'Chưa có thông tin',
                    subjects: Array.isArray(parsed.subjects)
                        ? parsed.subjects
                        : [],
                    courses_offered: Array.isArray(parsed.courses_offered)
                        ? parsed.courses_offered
                        : [],
                    application_portal:
                        parsed.application_portal || 'Chưa có thông tin',
                    required_documents: Array.isArray(parsed.required_documents)
                        ? parsed.required_documents
                        : [],
                    application_fee:
                        parsed.application_fee || 'Chưa có thông tin',
                    exam_fee: parsed.exam_fee || 'Chưa có thông tin',
                    exam_mode: parsed.exam_mode || 'Chưa có thông tin',
                    contact_email: parsed.contact_email || null,
                    contact_phone: parsed.contact_phone || null,
                    sample_tests_url: parsed.sample_tests_url || null,
                    raw_summary:
                        parsed.raw_summary || 'Chưa có tóm tắt chi tiết.',
                };
            } catch (error: any) {
                const status = error.response?.status;
                if (
                    (status === 503 || status === 429) &&
                    i < fallbackModels.length - 1
                ) {
                    this.logger.warn(
                        `Model ${currentModel} returned status ${status}. Switching to fallback model ${fallbackModels[i + 1]}...`,
                    );
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                } else {
                    if (error.response) {
                        this.logger.error(
                            `Interactions API Error (${currentModel}): ${JSON.stringify(error.response.data)}`,
                        );
                    }
                    throw error;
                }
            }
        }

        return {
            funding_type: 'Chưa có thông tin',
            partner_universities: [],
            exam_date_raw: 'Chưa có thông tin',
            application_deadline: 'Chưa có thông tin',
            subjects: [],
            courses_offered: [],
            application_portal: 'Chưa có thông tin',
            required_documents: [],
            application_fee: 'Chưa có thông tin',
            exam_fee: 'Chưa có thông tin',
            exam_mode: 'Chưa có thông tin',
            contact_email: null,
            contact_phone: null,
            sample_tests_url: null,
            raw_summary:
                'Không thể trích xuất thông tin do máy chủ AI đang quá tải.',
        };
    }

    async crawlBySlug(slug: string) {
        const stk = await this.stkRepository.findBySlug(slug);
        if (!stk) {
            throw new NotFoundException(
                `Studienkolleg with slug "${slug}" was not found`,
            );
        }

        this.logger.log(
            `Crawling main page, sub-links, PDFs and running Vietnamese AI extraction for: ${stk.slug}`,
        );
        const pageContent = await this.buildComprehensiveContext(stk);
        const extractedData = await this.extractWithAi(stk, pageContent);

        const payload: UpsertExamInfoPayload = {
            studienkolleg_id: stk.id,
            ...extractedData,
        };

        const savedRecord = await this.stkRepository.upsertExamInfo(payload);

        return {
            slug: stk.slug,
            name: stk.name,
            status: 'success',
            data: savedRecord,
        };
    }

    async seedCatalog() {
        this.logger.log(
            `Seeding ${STUDIENKOLLEG_SEED_DATA.length} Studienkollegs into Supabase...`,
        );
        const seeded = await this.stkRepository.upsertSchools(
            STUDIENKOLLEG_SEED_DATA,
        );
        return {
            count: seeded.length,
            schools: seeded.map((s) => ({
                slug: s.slug,
                name: s.name,
                city: s.city,
                state: s.state,
            })),
        };
    }

    async crawlAll(onlyMissing = false) {
        await this.seedCatalog();
        const allSchools = await this.stkRepository.findAll();
        const targetSchools = onlyMissing
            ? allSchools.filter((s) => !s.entrance_exam_info)
            : allSchools;

        const results: any[] = [];
        const concurrency = 3;

        for (let i = 0; i < targetSchools.length; i += concurrency) {
            const batch = targetSchools.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map(async (school) => {
                    try {
                        return await this.crawlBySlug(school.slug);
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : 'Unknown error';
                        this.logger.error(
                            `Failed to crawl ${school.slug}: ${message}`,
                        );
                        return {
                            slug: school.slug,
                            name: school.name,
                            status: 'failed',
                            error: message,
                        };
                    }
                }),
            );
            results.push(...batchResults);
            if (i + concurrency < targetSchools.length) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }

        return results;
    }
}
