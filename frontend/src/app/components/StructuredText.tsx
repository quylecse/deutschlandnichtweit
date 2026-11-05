import React from 'react';
import { isMeaningfulValue } from '../lib/studienkollegs';

/**
 * Làm nổi bật các từ khóa quan trọng (trình độ tiếng, lệ phí, cổng nộp, kỳ thi) trong câu văn
 */
function highlightKeyTerms(text: string): React.ReactNode[] {
  const pattern =
    /(\b(?:B1|B2|C1|DSH|TestDaF|C-Test|e-C-Test|Uni-Assist|HISinOne|APS|FSP|Feststellungsprüfung|Aufnahmetest|Zulassung|T-Kurs|M-Kurs|W-Kurs|G-Kurs|S-Kurs)\b|\b\d+\s*(?:EUR|€)\b|miễn học phí|miễn phí)/gi;

  const parts = text.split(pattern);
  return parts.map((part, idx) => {
    if (pattern.test(part)) {
      pattern.lastIndex = 0;
      return (
        <strong
          key={idx}
          className="font-semibold text-[#111111] bg-[#EAE7DF] px-1 py-0.2 rounded-[2px]"
        >
          {part}
        </strong>
      );
    }
    pattern.lastIndex = 0;
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Xác định nhãn chủ đề cho từng đoạn văn trong phần Tóm tắt tuyển sinh
 */
function inferParagraphTopic(paragraph: string, index: number): string {
  const lower = paragraph.toLowerCase();
  if (
    lower.includes('bài thi') ||
    lower.includes('c-test') ||
    lower.includes('chuyên ngành') ||
    lower.includes('trực tiếp tại') ||
    lower.includes('máy tính')
  ) {
    return 'Cấu trúc & Hình thức thi';
  }
  if (
    lower.includes('học phí') ||
    lower.includes('eur') ||
    lower.includes('chi phí') ||
    lower.includes('phí học kỳ')
  ) {
    return 'Học phí & Lệ phí';
  }
  if (
    lower.includes('ứng tuyển') ||
    lower.includes('nộp hồ sơ') ||
    lower.includes('uni-assist') ||
    lower.includes('đăng ký') ||
    lower.includes('thư mời') ||
    lower.includes('trình độ tiếng đức')
  ) {
    return 'Điều kiện & Quy trình đăng ký';
  }
  if (
    lower.includes('công lập') ||
    lower.includes('tư nhân') ||
    lower.includes('đào tạo') ||
    lower.includes('khối')
  ) {
    return 'Tổng quan & Khối đào tạo';
  }
  const fallbackTopics = [
    'Tổng quan trường',
    'Quy trình tuyển sinh',
    'Thông tin kỳ thi',
    'Chi phí & Lưu ý',
  ];
  return fallbackTopics[index % fallbackTopics.length];
}

/**
 * Tách một đoạn văn dài thành các đoạn nhỏ theo nhóm ý (mỗi đoạn 1-2 câu có cùng chủ đề)
 */
function splitIntoReadableParagraphs(raw: string): string[] {
  const explicitLines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (explicitLines.length >= 2) {
    return explicitLines;
  }

  // Tách theo câu (dấu chấm theo sau bởi khoảng trắng và chữ in hoa)
  const sentences = raw
    .split(/(?<=\.)\s+(?=[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [raw.trim()];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTopic = '';

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const topic = inferParagraphTopic(s, i);

    if (
      currentChunk.length === 0 ||
      (currentChunk.length < 2 && topic === currentTopic)
    ) {
      currentChunk.push(s);
      currentTopic = topic;
    } else {
      chunks.push(currentChunk.join(' '));
      currentChunk = [s];
      currentTopic = topic;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * 1. Hiển thị bản Tóm tắt tuyển sinh được chia đoạn theo chủ đề, có tiêu đề phụ và highlight từ khóa
 */
export function StructuredSummary({
  text,
  fallback = 'Chưa có ghi chú chi tiết. Vui lòng xem trực tiếp trên trang chủ của trường.',
}: {
  text?: string | null;
  fallback?: string;
}) {
  if (!isMeaningfulValue(text)) {
    return <p className="text-sm text-[#6E6D68] italic">{fallback}</p>;
  }

  const paragraphs = splitIntoReadableParagraphs(text!);

  return (
    <div className="space-y-4">
      {paragraphs.map((para, idx) => {
        const cleanPara = para.replace(/^[-•*]\s*/, '').trim();
        const topicLabel = inferParagraphTopic(cleanPara, idx);

        return (
          <div
            key={idx}
            className="border-l-2 border-[#111111] pl-4 py-1 bg-[#EFECE6]/35"
          >
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 font-medium">
              {String(idx + 1).padStart(2, '0')} · {topicLabel}
            </span>
            <p className="text-sm sm:text-[15px] text-[#1E1E1C] leading-[1.75]">
              {highlightKeyTerms(cleanPara)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 2. Hiển thị Quy trình / Cổng nộp hồ sơ tách thành từng bước rõ ràng
 */
export function StructuredSteps({
  text,
  fallback = 'Chưa có thông tin chi tiết.',
}: {
  text?: string | null;
  fallback?: string;
}) {
  if (!isMeaningfulValue(text)) {
    return <p className="text-sm text-[#6E6D68]">{fallback}</p>;
  }

  const raw = text!.trim();

  // Kiểm tra mẫu "1. ... 2. ... 3. ..." hoặc "Bước 1... Bước 2..."
  const stepRegex = /(?:^|\s+)(?:Bước\s*\d+[,:.]?|\d+\.)\s+/gi;
  const matches = Array.from(raw.matchAll(stepRegex));

  if (matches.length >= 2) {
    const firstMatchIdx = matches[0].index ?? 0;
    const intro = raw
      .slice(0, firstMatchIdx)
      .replace(/[:.]\s*$/, '')
      .trim();

    const steps: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = (matches[i].index ?? 0) + matches[i][0].length;
      const end =
        i + 1 < matches.length ? (matches[i + 1].index ?? raw.length) : raw.length;
      const stepContent = raw.slice(start, end).trim();
      if (stepContent) steps.push(stepContent);
    }

    return (
      <div className="space-y-3">
        {intro && (
          <p className="text-xs uppercase tracking-wider text-[#5A5955] font-medium">
            {intro}:
          </p>
        )}
        <ol className="space-y-2.5">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 bg-[#F6F5F0] border border-[#D6D4CC] p-3"
            >
              <span className="shrink-0 bg-[#111111] text-[#F6F5F0] font-mono text-[11px] px-2 py-0.5 mt-0.5">
                BƯỚC {idx + 1}
              </span>
              <span className="text-sm text-[#111111] leading-relaxed">
                {highlightKeyTerms(step)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // Nếu không có đánh số bước, tách thành từng câu riêng biệt cho dễ đọc
  const sentences = raw
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return (
      <p className="text-sm text-[#111111] leading-relaxed">
        {highlightKeyTerms(raw)}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sentences.map((sentence, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm text-[#111111] leading-relaxed">
          <span className="text-[#6E6D68] font-mono text-xs mt-1">•</span>
          <span>{highlightKeyTerms(sentence)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 3. Hiển thị các trường nhiều câu (Lệ phí, Hạn nộp, Hình thức thi) thành danh sách gạch đầu dòng ngắn gọn
 */
export function StructuredSentenceList({
  text,
  fallback = '—',
}: {
  text?: string | null;
  fallback?: string;
}) {
  if (!isMeaningfulValue(text)) {
    return <span className="text-[#9A9890]">{fallback}</span>;
  }

  const raw = text!.trim();
  const sentences = raw
    .split(/(?<=\.)\s+(?=[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return (
      <span className="text-sm text-[#111111] leading-relaxed">
        {highlightKeyTerms(raw)}
      </span>
    );
  }

  return (
    <ul className="space-y-1.5 text-sm text-[#111111]">
      {sentences.map((s, idx) => {
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0 && colonIdx < 35) {
          const label = s.slice(0, colonIdx).trim();
          const rest = s.slice(colonIdx + 1).trim();
          return (
            <li key={idx} className="leading-relaxed flex items-start gap-2">
              <span className="text-[#6E6D68] text-xs mt-1">▪</span>
              <span>
                <strong className="font-medium text-[#111111]">{label}:</strong>{' '}
                {highlightKeyTerms(rest)}
              </span>
            </li>
          );
        }
        return (
          <li key={idx} className="leading-relaxed flex items-start gap-2">
            <span className="text-[#6E6D68] text-xs mt-1">▪</span>
            <span>{highlightKeyTerms(s)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 4. Hiển thị danh sách Môn thi tách riêng tên môn và ghi chú trong ngoặc
 */
export function SubjectListFormatted({ subjects }: { subjects?: string[] | null }) {
  if (!subjects || subjects.length === 0) {
    return <span className="text-[#9A9890]">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {subjects.map((sub, idx) => {
        const match = sub.match(/^([^(]+)\(([^)]+)\)$/);
        if (match) {
          return (
            <div
              key={idx}
              className="inline-flex items-center border border-[#D6D4CC] bg-[#EFECE6]/60 px-2.5 py-1 text-xs"
            >
              <span className="font-medium text-[#111111]">{match[1].trim()}</span>
              <span className="text-[#6E6D68] ml-1.5 border-l border-[#D6D4CC] pl-1.5 text-[11px]">
                {match[2].trim()}
              </span>
            </div>
          );
        }
        return (
          <span
            key={idx}
            className="inline-flex items-center border border-[#D6D4CC] bg-[#EFECE6]/60 px-2.5 py-1 text-xs font-medium text-[#111111]"
          >
            {sub}
          </span>
        );
      })}
    </div>
  );
}

