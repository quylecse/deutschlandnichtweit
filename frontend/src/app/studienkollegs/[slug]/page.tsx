import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatTypeShort,
  formatValue,
  getStudienkollegBySlug,
  getStudienkollegs,
  isMeaningfulValue,
} from '../../lib/studienkollegs';
import SemesterDateDisplay from '../../components/SemesterDateDisplay';
import SiteFooter from '../../components/SiteFooter';
import { getCityImage } from '../../lib/schoolImages';
import {
  StructuredSentenceList,
  StructuredSteps,
  StructuredSummary,
  SubjectListFormatted,
} from '../../components/StructuredText';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function SchoolDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [school, allSchools] = await Promise.all([
    getStudienkollegBySlug(slug),
    getStudienkollegs(),
  ]);

  if (!school) {
    notFound();
  }

  const exam = school.entrance_exam_info;
  const relatedInState = allSchools.filter(
    (s) => s.state === school.state && s.id !== school.id
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
      {/* Breadcrumb info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#111111] pb-4 mb-6 sm:mb-8 text-xs text-[#6E6D68]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="uppercase tracking-[0.14em]">
            {school.city} · {school.state}
          </span>
          {isMeaningfulValue(exam?.funding_type) && (
            <span className="border border-[#111111] px-1.5 py-0.2 text-[9px] uppercase tracking-wider text-[#111111] font-medium">
              {exam!.funding_type}
            </span>
          )}
        </div>
        {exam?.last_crawled_at && (
          <span className="text-[11px] sm:text-xs">
            Cập nhật: {new Date(exam.last_crawled_at).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>

      {/* School Title & Campus Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
        <div className="max-w-2xl">
          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#111111] leading-[1.08] tracking-tight">
            {school.name}
          </h1>
        </div>
        <div className="w-full md:w-56 h-36 border border-[#111111] overflow-hidden shrink-0">
          <img
            src={getCityImage(school.city)}
            alt={school.city}
            className="w-full h-full object-cover grayscale contrast-115 hover:grayscale-0 transition-all duration-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-t border-[#111111] pt-8 sm:pt-10">
        {/* Left Column: Key Specs & Contact */}
        <div className="lg:col-span-5 space-y-8 sm:space-y-10">
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
              01 / Thông tin cơ bản
            </h2>

            <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC] text-xs sm:text-sm">
              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Thành phố</dt>
                <dd className="text-right font-medium text-[#111111]">{school.city}</dd>
              </div>

              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Bang</dt>
                <dd className="text-right text-[#111111]">{school.state}</dd>
              </div>

              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Loại hình</dt>
                <dd className="text-right font-medium text-[#111111]">
                  {formatValue(exam?.funding_type, 'Công lập')}
                </dd>
              </div>

              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Hệ trường</dt>
                <dd className="text-right text-[#111111]">{formatTypeShort(school.type)}</dd>
              </div>

              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Khối đào tạo</dt>
                <dd className="text-right text-[#111111] font-medium">
                  {exam?.courses_offered?.length ? exam.courses_offered.join(', ') : '—'}
                </dd>
              </div>

              <div className="py-2.5 sm:py-3.5">
                <dt className="text-[#6E6D68] mb-1.5 sm:mb-2">Môn thi đầu vào</dt>
                <dd className="text-[#111111]">
                  <SubjectListFormatted subjects={exam?.subjects} />
                </dd>
              </div>

              <div className="py-2.5 sm:py-3.5">
                <dt className="text-[#6E6D68] mb-1.5 sm:mb-2">Hình thức thi</dt>
                <dd className="text-[#111111]">
                  <StructuredSentenceList text={exam?.exam_mode} />
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
              02 / Liên hệ & Trang thông tin
            </h2>

            <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC] text-xs sm:text-sm mb-5 sm:mb-6">
              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Email</dt>
                <dd className="text-right text-[#111111] break-all truncate max-w-[220px]">
                  {isMeaningfulValue(exam?.contact_email) ? (
                    <a
                      href={`mailto:${exam!.contact_email}`}
                      className="underline underline-offset-4 hover:opacity-60"
                    >
                      {exam!.contact_email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>

              <div className="py-2.5 sm:py-3.5 flex justify-between gap-3">
                <dt className="text-[#6E6D68] shrink-0">Điện thoại</dt>
                <dd className="text-right text-[#111111]">
                  {isMeaningfulValue(exam?.contact_phone) ? (
                    <a
                      href={`tel:${exam!.contact_phone}`}
                      className="underline underline-offset-4 hover:opacity-60"
                    >
                      {exam!.contact_phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>

            <div className="space-y-2 text-xs">
              <a
                href={school.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-[#111111] px-4 py-2.5 sm:py-3 text-[#111111] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors uppercase tracking-wider"
              >
                <span>Trang chủ trường</span>
                <span>↗</span>
              </a>

              {school.crawler_url && school.crawler_url !== school.website_url && (
                <a
                  href={school.crawler_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-[#D6D4CC] px-4 py-2.5 sm:py-3 text-[#111111] hover:border-[#111111] transition-colors uppercase tracking-wider"
                >
                  <span>Trang thông tin tuyển sinh</span>
                  <span>↗</span>
                </a>
              )}

              {isMeaningfulValue(exam?.sample_tests_url) && (
                <a
                  href={exam!.sample_tests_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-[#D6D4CC] px-4 py-2.5 sm:py-3 text-[#111111] hover:border-[#111111] transition-colors uppercase tracking-wider"
                >
                  <span>Tài liệu & Đề thi mẫu</span>
                  <span>↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Schedule, Application, Partners & Summary */}
        <div className="lg:col-span-7 space-y-8 sm:space-y-10">
          {/* Schedule */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
              03 / Lịch thi Aufnahmetest & Hạn nộp
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#111111] divide-y sm:divide-y-0 sm:divide-x divide-[#111111]">
              <div className="p-4 sm:p-5">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6E6D68] mb-1.5 sm:mb-2">
                  Ngày thi dự kiến
                </p>
                <div className="text-xs sm:text-sm leading-relaxed">
                  <SemesterDateDisplay
                    raw={exam?.exam_date_raw}
                    context={exam?.raw_summary}
                    fallback="Chưa công bố"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6E6D68] mb-1.5 sm:mb-2">
                  Hạn nộp hồ sơ
                </p>
                <div className="text-xs sm:text-sm leading-relaxed">
                  <SemesterDateDisplay
                    raw={exam?.application_deadline}
                    context={exam?.raw_summary}
                    fallback="Xem trên trang chủ trường"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Application Portal, Fees & Documents */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
              04 / Quy trình đăng ký, Lệ phí & Hồ sơ cần nộp
            </h2>

            <div className="border border-[#D6D4CC] bg-[#EFECE6]/50 divide-y divide-[#D6D4CC] text-xs sm:text-sm">
              <div className="p-3.5 sm:p-5">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6E6D68] mb-2">
                  Cổng / Phương thức nộp hồ sơ
                </p>
                <StructuredSteps
                  text={exam?.application_portal}
                  fallback="Chưa có thông tin chi tiết"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D4CC]">
                <div className="p-3.5 sm:p-5">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Lệ phí nộp & xử lý hồ sơ
                  </p>
                  <StructuredSentenceList
                    text={exam?.application_fee}
                    fallback="Chưa có thông tin"
                  />
                </div>

                <div className="p-3.5 sm:p-5">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6E6D68] mb-1.5">
                    Lệ phí dự thi Aufnahmetest
                  </p>
                  <StructuredSentenceList
                    text={exam?.exam_fee}
                    fallback="Chưa có thông tin"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-5">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6E6D68] mb-2">
                  Tài liệu cần nộp khi đăng ký
                </p>
                {exam?.required_documents && exam.required_documents.length > 0 ? (
                  <ul className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC]">
                    {exam.required_documents.map((doc, idx) => (
                      <li key={idx} className="py-2 flex items-start gap-2 text-[#111111] leading-relaxed">
                        <span className="font-mono text-xs text-[#6E6D68] mt-0.5">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#6E6D68]">
                    Xem danh sách chi tiết trên trang tuyển sinh của trường.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Partner Universities */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
              05 / Các trường Đại học liên kết ({exam?.partner_universities?.length || 0})
            </h2>
            {exam?.partner_universities && exam.partner_universities.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[#D6D4CC] pt-3 sm:pt-4 text-xs sm:text-sm">
                {exam.partner_universities.map((uni, idx) => (
                  <li
                    key={idx}
                    className="border border-[#D6D4CC] bg-[#EFECE6]/40 px-3 py-2 sm:px-3.5 sm:py-2.5 text-[#111111] flex items-start gap-2"
                  >
                    <span className="text-xs text-[#6E6D68] font-mono mt-0.5">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{uni}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border-t border-[#D6D4CC] pt-4 text-xs sm:text-sm text-[#6E6D68]">
                Chưa có danh sách các trường đại học liên kết.
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
              06 / Tóm tắt tuyển sinh chi tiết
            </h2>
            <div className="border-t border-[#D6D4CC] pt-4 sm:pt-5">
              <StructuredSummary
                text={exam?.raw_summary}
                fallback="Chưa có ghi chú chi tiết. Vui lòng xem trực tiếp trên trang chủ của trường."
              />
            </div>
          </div>

          {relatedInState.length > 0 && (
            <div className="pt-6 border-t border-[#D6D4CC]">
              <h2 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-3 sm:mb-4">
                07 / Trường cùng bang ({school.state})
              </h2>
              <ul className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC] text-xs sm:text-sm">
                {relatedInState.map((rel) => (
                  <li key={rel.id}>
                    <Link
                      href={`/studienkollegs/${rel.slug || rel.id}`}
                      className="py-2.5 sm:py-3 flex items-center justify-between hover:opacity-60 transition-opacity"
                    >
                      <span>{rel.name}</span>
                      <span className="text-xs text-[#6E6D68]">{rel.city} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailFallback() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-16 text-xs uppercase tracking-[0.16em] text-[#6E6D68] animate-pulse">
      Đang tải thông tin trường...
    </main>
  );
}

export default function StudienkollegDetailPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#111111] flex flex-col justify-between">
      <div>
        <header className="border-b border-[#111111] px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between text-xs">
          <Link href="/" className="font-semibold tracking-[0.12em] uppercase hover:opacity-60 truncate max-w-[200px] sm:max-w-none">
            Deutschland.Nicht.Weit
          </Link>

          <Link
            href="/studienkollegs"
            className="text-[#111111] hover:opacity-60 uppercase tracking-wider text-[11px] sm:text-xs"
          >
            ← Bảng tra cứu
          </Link>
        </header>

        <Suspense fallback={<DetailFallback />}>
          <SchoolDetailContent params={params} />
        </Suspense>
      </div>

      <SiteFooter />
    </div>
  );
}
