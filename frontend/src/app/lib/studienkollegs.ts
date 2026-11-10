import { Studienkolleg } from '../types/studienkolleg';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3001'
).replace(/\/$/, '');

export async function getStudienkollegs(): Promise<Studienkolleg[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/studienkollegs`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch studienkollegs');
    return res.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

export async function getStudienkollegBySlug(slug: string): Promise<Studienkolleg | null> {
  const schools = await getStudienkollegs();
  return schools.find((s) => s.slug === slug || s.id === slug) || null;
}

export function isMeaningfulValue(val?: string | null): boolean {
  if (!val) return false;
  const normalized = val.trim().toLowerCase();
  return (
    normalized !== '' &&
    normalized !== 'information not available' &&
    normalized !== 'not available' &&
    normalized !== 'chưa có thông tin' &&
    normalized !== 'không có thông tin' &&
    normalized !== 'chưa công bố' &&
    normalized !== 'n/a' &&
    normalized !== 'none' &&
    normalized !== 'null'
  );
}

export function formatValue(val?: string | null, fallback = '—'): string {
  return isMeaningfulValue(val) ? val!.trim() : fallback;
}

export interface SemesterEntry {
  prefix: 'WiSe' | 'SoSe' | 'Ghi chú';
  text: string;
}

/**
 * Phân tích và luôn gán rõ ràng nhãn WiSe hoặc SoSe ngắn gọn cho từng mốc thời gian
 */
export function parseSemesterEntries(
  raw?: string | null,
  contextText?: string | null
): SemesterEntry[] {
  if (!isMeaningfulValue(raw)) return [];
  const text = raw!.trim();
  const context = (contextText || '').toLowerCase();

  const entries: SemesterEntry[] = [];

  // 1. Match cụm ngày (có thể gồm "11.01.2027 và 12.01.2027") đi kèm ngoặc (WiSe / SoSe / Kỳ Đông / Kỳ Hè)
  const regexGroupWithParens =
    /([0-9]{1,2}\.[0-9]{1,2}\.?(?:[0-9]{2,4})?(?:\s*(?:và|and|-|–|\/)\s*[0-9]{1,2}\.[0-9]{1,2}\.?(?:[0-9]{2,4})?)?)\s*\(([^)]*(?:winter|sommer|summer|wise|sose|kỳ đông|kỳ hè|mùa đông|mùa hè)[^)]*)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = regexGroupWithParens.exec(text)) !== null) {
    const date = match[1].trim().replace(/\s+và\s+/gi, ' – ');
    const semInfo = match[2].toLowerCase();
    const isWinter =
      semInfo.includes('winter') ||
      semInfo.includes('wise') ||
      semInfo.includes('đông');
    const prefix: 'WiSe' | 'SoSe' = isWinter ? 'WiSe' : 'SoSe';
    entries.push({ prefix, text: date });
  }

  if (entries.length > 0) {
    return entries.sort((a, b) => (a.prefix === 'WiSe' ? -1 : 1));
  }

  // 2. Match mẫu tiếng Việt không ngoặc: "15.07 cho kỳ Đông" / "15.01 cho kỳ Hè"
  const regexViInline =
    /([0-9]{1,2}\.[0-9]{1,2}\.?(?:[0-9]{2,4})?)\s*(?:cho\s+)?(kỳ đông|kỳ hè|mùa đông|mùa hè|wise|sose)/gi;
  while ((match = regexViInline.exec(text)) !== null) {
    const date = match[1].trim();
    const semInfo = match[2].toLowerCase();
    const prefix: 'WiSe' | 'SoSe' =
      semInfo.includes('đông') || semInfo.includes('wise') ? 'WiSe' : 'SoSe';
    entries.push({ prefix, text: date });
  }

  if (entries.length > 0) {
    return entries.sort((a, b) => (a.prefix === 'WiSe' ? -1 : 1));
  }

  // 3. Trường hợp có 1 mốc ngày cụ thể
  const singleDateMatch = text.match(
    /([0-9]{1,2}\.[0-9]{1,2}\.?(?:[0-9]{2,4})?(?:\s*(?:-|–)\s*[0-9]{1,2}\.[0-9]{1,2}\.?(?:[0-9]{2,4})?)?)/
  );
  if (singleDateMatch) {
    const dateStr = singleDateMatch[1].trim();
    const combined = `${text.toLowerCase()} ${context}`;

    let prefix: 'WiSe' | 'SoSe' = 'SoSe';

    if (
      combined.includes('wintersemester') ||
      combined.includes('winter semester') ||
      combined.includes('wise') ||
      combined.includes('kỳ đông') ||
      combined.includes('mùa đông')
    ) {
      prefix = 'WiSe';
    } else if (
      combined.includes('sommersemester') ||
      combined.includes('summer semester') ||
      combined.includes('sose') ||
      combined.includes('kỳ hè') ||
      combined.includes('mùa hè')
    ) {
      prefix = 'SoSe';
    } else {
      const parts = dateStr.split('.');
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        if (month >= 5 && month <= 10) {
          prefix = 'WiSe';
        } else {
          prefix = 'SoSe';
        }
      }
    }

    return [{ prefix, text: dateStr }];
  }

  // 4. Fallback cô đọng nếu là câu mô tả dài
  if (text.toLowerCase().includes('đối tác') || text.toLowerCase().includes('từng trường')) {
    return [{ prefix: 'Ghi chú', text: 'Theo trường ĐH đối tác' }];
  }

  return [{ prefix: 'Ghi chú', text: text.length > 40 ? `${text.slice(0, 38)}…` : text }];
}

export function formatTypeShort(type: Studienkolleg['type']): string {
  switch (type) {
    case 'UNIVERSITAET':
      return 'Universität';
    case 'FACHHOCHSCHULE':
      return 'Fachhochschule';
    case 'BOTH':
      return 'Uni & FH';
    default:
      return type;
  }
}

export function formatCoursesCompact(courses?: string[] | null): string {
  if (!courses || courses.length === 0) return '—';
  return courses
    .map((c) => c.replace('-Kurs', '').trim())
    .join(' · ');
}

export function formatFundingShort(funding?: string | null): 'Công lập' | 'Tư nhân' | '—' {
  if (!isMeaningfulValue(funding)) return '—';
  const lower = funding!.toLowerCase();
  if (lower.includes('tư nhân') || lower.includes('privat')) return 'Tư nhân';
  if (lower.includes('công lập') || lower.includes('staatlich')) return 'Công lập';
  return 'Công lập';
}

export function formatExamModeShort(mode?: string | null): {
  label: string;
} {
  if (!isMeaningfulValue(mode)) return { label: '—' };
  const lower = mode!.toLowerCase();
  const hasNoOnline =
    lower.includes('không có hình thức thi trực tuyến') ||
    lower.includes('không thi online') ||
    lower.includes('không tổ chức thi trực tuyến');
  const isOnline =
    !hasNoOnline && (lower.includes('trực tuyến') || lower.includes('online'));
  const isOnsite =
    lower.includes('tại chỗ') ||
    lower.includes('präsenz') ||
    lower.includes('trực tiếp') ||
    lower.includes('tại trường') ||
    lower.includes('tại đức');

  if (isOnline && isOnsite) {
    return { label: 'Online & Tại chỗ' };
  }
  if (isOnline) {
    return { label: 'Online' };
  }
  if (isOnsite) {
    return { label: 'Tại chỗ' };
  }
  return { label: mode!.length > 24 ? `${mode!.slice(0, 22)}…` : mode! };
}

export function formatPortalShort(portal?: string | null): {
  badge: string;
  detail: string;
} {
  if (!isMeaningfulValue(portal)) {
    return { badge: '—', detail: 'Xem chi tiết trong hồ sơ' };
  }
  const lower = portal!.toLowerCase();
  const hasUniAssist = lower.includes('uni-assist') || lower.includes('uniassist');
  const hasPartner =
    lower.includes('đại học') &&
    (lower.includes('đối tác') ||
      lower.includes('trong bang') ||
      lower.includes('liên kết') ||
      lower.includes('không nộp hồ sơ trực tiếp'));
  const hasPortal =
    lower.includes('hisinone') ||
    lower.includes('portal') ||
    lower.includes('cổng trực tuyến');

  if (hasPartner && hasPortal) {
    return {
      badge: 'Qua ĐH đối tác + Portal STK',
      detail: 'Xin Zulassung từ ĐH đối tác rồi đăng ký trên Portal trường',
    };
  }
  if (hasPartner) {
    return {
      badge: 'Qua trường ĐH liên kết',
      detail: 'Nộp qua Uni-Assist / cổng của trường ĐH trong bang',
    };
  }
  if (hasUniAssist) {
    return {
      badge: 'Qua Uni-Assist',
      detail: 'Nộp hồ sơ trực tuyến trên cổng Uni-Assist',
    };
  }
  if (hasPortal) {
    return {
      badge: 'Portal riêng của trường',
      detail: 'Đăng ký trực tiếp qua cổng tuyển sinh của trường',
    };
  }
  return {
    badge: 'Theo quy định trường',
    detail: portal!.length > 55 ? `${portal!.slice(0, 52)}…` : portal!,
  };
}

export function formatExamFeeShort(examFee?: string | null): string {
  if (!isMeaningfulValue(examFee)) return 'Miễn phí';

  const raw = examFee!.trim();
  const lower = raw.toLowerCase();

  // Nếu khẳng định miễn phí dự thi / không thu lệ phí thi
  if (
    lower.includes('miễn phí dự thi') ||
    lower.includes('miễn phí thi') ||
    lower.includes('không thu lệ phí dự thi') ||
    lower.includes('không thu phí dự thi') ||
    lower.includes('không mất phí dự thi') ||
    lower.includes('không có lệ phí thi') ||
    lower === 'miễn phí' ||
    lower.startsWith('miễn phí')
  ) {
    return 'Miễn phí';
  }

  // Tách thành từng mệnh đề để loại bỏ các câu nhắc tới Semesterbeitrag / phí học kỳ / Uni-Assist
  const clauses = raw.split(/[.;\n]|(?:\bnhưng\b|\btuy nhiên\b|\bngoài ra\b)/i);
  const examOnlyClauses = clauses.filter((clause) => {
    const c = clause.toLowerCase();
    const isSemesterFee =
      c.includes('semesterbeitrag') ||
      c.includes('phí học kỳ') ||
      c.includes('đóng góp học kỳ') ||
      c.includes('lệ phí học kỳ') ||
      c.includes('học phí') ||
      c.includes('uni-assist') ||
      c.includes('uniassist') ||
      c.includes('khi nhập học');
    return !isSemesterFee;
  });

  const filteredText = examOnlyClauses.join(' ').trim();
  if (!filteredText) {
    return 'Miễn phí';
  }

  const filteredLower = filteredText.toLowerCase();
  if (
    filteredLower.includes('miễn phí') ||
    filteredLower.includes('không thu') ||
    filteredLower.includes('không mất phí')
  ) {
    return 'Miễn phí';
  }

  const euroMatch = filteredText.match(/(\d+(?:[.,]\d+)?\s*(?:EUR|€))/i);
  if (euroMatch) {
    return euroMatch[1].toUpperCase().replace('€', ' EUR').replace(/\s+/g, ' ').trim();
  }

  return 'Miễn phí';
}

/**
 * Trích xuất timestamp (ms) từ chuỗi ngày tháng kiểu Đức (DD.MM.YYYY hoặc DD.MM.)
 * Dùng để sort chính xác theo thời gian cho cột Ngày thi và Hạn nộp hồ sơ.
 * Trả về null nếu chuỗi không chứa ngày tháng cụ thể.
 */
export function extractSortableTimestamp(raw?: string | null): number | null {
  if (!isMeaningfulValue(raw)) return null;

  const text = raw!;
  const regex = /\b(\d{1,2})\.(\d{1,2})\.(?:(\d{2,4}))?/g;
  const timestamps: number[] = [];
  const currentYear = new Date().getFullYear();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (day < 1 || day > 31 || month < 1 || month > 12) continue;

    let year = match[3] ? parseInt(match[3], 10) : currentYear;
    if (year < 100) {
      year += 2000;
    }

    const time = Date.UTC(year, month - 1, day);
    if (!Number.isNaN(time)) {
      timestamps.push(time);
    }
  }

  if (timestamps.length === 0) return null;

  return Math.min(...timestamps);
}

/**
 * Trích xuất trình độ tiếng Đức tối thiểu yêu cầu (B1, B2, hoặc C1)
 */
export function extractGermanLevel(school: Studienkolleg): 'B1' | 'B2' | 'C1' | 'B1/B2' | '—' {
  const exam = school.entrance_exam_info;
  if (!exam) return '—';

  const combinedText = [
    ...(exam.required_documents || []),
    exam.raw_summary,
    exam.application_portal,
  ]
    .filter(Boolean)
    .join(' ');

  const hasB1 = /\bB1\b/i.test(combinedText);
  const hasB2 = /\bB2\b/i.test(combinedText);
  const hasC1 = /\bC1\b/i.test(combinedText);

  // Nếu cả B1 và B2 đều được chấp nhận hoặc ghi "B1 hoặc B2"
  if (hasB1 && hasB2) return 'B1/B2';
  if (hasB1) return 'B1';
  if (hasB2) return 'B2';
  if (hasC1) return 'C1';

  // Với các trường công lập bang Hessen như Marburg, yêu cầu chung là B1/B2 tùy trường ĐH liên kết
  if (school.state === 'Hessen') return 'B1/B2';

  return '—';
}

