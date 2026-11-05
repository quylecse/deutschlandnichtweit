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
  sub?: string;
} {
  if (!isMeaningfulValue(mode)) return { label: '—' };
  const lower = mode!.toLowerCase();
  const isOnline = lower.includes('trực tuyến') || lower.includes('online');
  const isOnsite =
    lower.includes('tại chỗ') || lower.includes('präsenz') || lower.includes('trực tiếp');
  const isComputer = lower.includes('máy tính') || lower.includes('e-c-test');

  if (isOnline && isOnsite && !lower.includes('không có hình thức thi trực tuyến')) {
    return { label: 'Online & Tại chỗ', sub: isComputer ? 'Trên máy tính' : undefined };
  }
  if (isOnline && !lower.includes('không có hình thức thi trực tuyến')) {
    return { label: 'Thi Online', sub: 'Trực tuyến' };
  }
  if (isOnsite) {
    return { label: 'Tại chỗ (Präsenz)', sub: isComputer ? 'Trên máy tính' : 'Tại trường' };
  }
  return { label: mode!.length > 28 ? `${mode!.slice(0, 26)}…` : mode! };
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
  if (!isMeaningfulValue(examFee)) return '—';
  const lower = examFee!.toLowerCase();
  const euroMatch = examFee!.match(/(\d+\s*(?:EUR|€))/i);
  if (lower.includes('miễn phí dự thi') || lower.startsWith('miễn phí')) {
    return 'Miễn phí thi';
  }
  if (euroMatch) {
    return `${euroMatch[1].toUpperCase().replace('€', ' EUR')}`;
  }
  return examFee!.length > 25 ? `${examFee!.slice(0, 24)}…` : examFee!;
}
