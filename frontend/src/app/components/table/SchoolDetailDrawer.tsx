'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Studienkolleg } from '../../types/studienkolleg';
import { getCityImage } from '../../lib/schoolImages';
import {
  extractGermanLevel,
  formatFundingShort,
  formatTypeShort,
  formatValue,
  isMeaningfulValue,
} from '../../lib/studienkollegs';
import SemesterDateDisplay from '../SemesterDateDisplay';
import {
  StructuredSentenceList,
  StructuredSteps,
  StructuredSummary,
  SubjectListFormatted,
} from '../StructuredText';

export type DrawerTab = 'overview' | 'application' | 'partners';

interface Props {
  school: Studienkolleg | null;
  activeDrawerTab: DrawerTab;
  setActiveDrawerTab: (tab: DrawerTab) => void;
  onClose: () => void;
}

export default function SchoolDetailDrawer({
  school,
  activeDrawerTab,
  setActiveDrawerTab,
  onClose,
}: Props) {
  if (!school) return null;

  const exam = school.entrance_exam_info;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-2xl bg-[#F6F5F0] h-full overflow-y-auto border-l border-[#111111] p-5 sm:p-8 lg:p-10 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#111111] pb-3 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 text-xs">
              <span className="uppercase tracking-[0.14em] text-[#6E6D68] truncate max-w-[200px] sm:max-w-none">
                {school.city} · {school.state}
              </span>
              <span className="border border-[#111111] px-1.5 py-0.2 text-[9px] uppercase font-medium text-[#111111] shrink-0">
                {formatFundingShort(exam?.funding_type)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs uppercase tracking-wider text-[#111111] hover:opacity-60 cursor-pointer p-1"
            >
              Đóng [×]
            </button>
          </div>

          {/* School Header with Campus Thumbnail */}
          <div className="flex items-start gap-4 mb-5 sm:mb-6">
            <img
              src={getCityImage(school.city)}
              alt={school.city}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover grayscale contrast-115 border border-[#111111] shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-editorial text-xl sm:text-2xl lg:text-3xl text-[#111111] leading-tight mb-1">
                {school.name}
              </h2>
              <span className="text-xs text-[#6E6D68] inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {school.city}, bang {school.state}
              </span>
            </div>
          </div>

          {/* Drawer Internal Tabs */}
          <div className="grid grid-cols-3 border border-[#111111] divide-x divide-[#111111] mb-5 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setActiveDrawerTab('overview')}
              className={`py-2 px-1 sm:px-3 uppercase tracking-wider text-center transition-colors cursor-pointer truncate ${
                activeDrawerTab === 'overview'
                  ? 'bg-[#111111] text-[#F6F5F0] font-medium'
                  : 'bg-[#F6F5F0] text-[#111111] hover:bg-[#EAE7DF]'
              }`}
            >
              01. Lịch thi
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawerTab('application')}
              className={`py-2 px-1 sm:px-3 uppercase tracking-wider text-center transition-colors cursor-pointer truncate ${
                activeDrawerTab === 'application'
                  ? 'bg-[#111111] text-[#F6F5F0] font-medium'
                  : 'bg-[#F6F5F0] text-[#111111] hover:bg-[#EAE7DF]'
              }`}
            >
              02. Hồ sơ
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawerTab('partners')}
              className={`py-2 px-1 sm:px-3 uppercase tracking-wider text-center transition-colors cursor-pointer truncate ${
                activeDrawerTab === 'partners'
                  ? 'bg-[#111111] text-[#F6F5F0] font-medium'
                  : 'bg-[#F6F5F0] text-[#111111] hover:bg-[#EAE7DF]'
              }`}
            >
              03. ĐH & LH
            </button>
          </div>

          {/* DRAWER TAB 1: OVERVIEW & EXAM */}
          {activeDrawerTab === 'overview' && (
            <div className="space-y-5 sm:space-y-6">
              <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#111111] text-xs sm:text-sm">
                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Loại & Hệ</dt>
                  <dd className="col-span-2 text-[#111111]">
                    {formatValue(exam?.funding_type, 'Công lập')} · {formatTypeShort(school.type)}
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Khối học</dt>
                  <dd className="col-span-2 text-[#111111] font-medium">
                    {exam?.courses_offered?.join(', ') || '—'}
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Môn thi</dt>
                  <dd className="col-span-2 text-[#111111]">
                    <SubjectListFormatted subjects={exam?.subjects} />
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Hình thức thi</dt>
                  <dd className="col-span-2 text-[#111111]">
                    <StructuredSentenceList text={exam?.exam_mode} />
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Lịch thi</dt>
                  <dd className="col-span-2 text-[#111111]">
                    <SemesterDateDisplay
                      raw={exam?.exam_date_raw}
                      context={exam?.raw_summary}
                      fallback="Chưa công bố"
                    />
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-2">
                  Tóm tắt tuyển sinh theo chủ đề
                </h3>
                <StructuredSummary
                  text={exam?.raw_summary}
                  fallback="Chưa có ghi chú chi tiết."
                />
              </div>
            </div>
          )}

          {/* DRAWER TAB 2: APPLICATION, FEES & DOCUMENTS */}
          {activeDrawerTab === 'application' && (
            <div className="space-y-5 sm:space-y-6 text-xs sm:text-sm">
              <div className="border border-[#111111] bg-[#EFECE6]/60 p-3.5 sm:p-4">
                <h3 className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6E6D68] mb-2">
                  Cổng & Quy trình nộp hồ sơ
                </h3>
                <StructuredSteps text={exam?.application_portal} />
              </div>

              <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#111111]">
                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Tiếng Đức yêu cầu</dt>
                  <dd className="col-span-2 text-[#111111] font-medium flex items-center gap-2">
                    <span className="bg-[#111111] text-[#F6F5F0] px-2 py-0.5 text-xs font-mono font-medium">
                      {extractGermanLevel(school)}
                    </span>
                    <span className="text-[11px] text-[#6E6D68]">
                      (Xem chi tiết chứng chỉ được chấp nhận ở danh sách bên dưới)
                    </span>
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Hạn nộp</dt>
                  <dd className="col-span-2 text-[#111111]">
                    <StructuredSentenceList text={exam?.application_deadline} />
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Lệ phí hồ sơ</dt>
                  <dd className="col-span-2 text-[#111111]">
                    <StructuredSentenceList text={exam?.application_fee} />
                  </dd>
                </div>

                <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                  <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Lệ phí thi</dt>
                  <dd className="col-span-2 text-[#111111]">
                    <StructuredSentenceList text={exam?.exam_fee} />
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-2">
                  Danh sách tài liệu cần nộp khi đăng ký
                </h3>
                {exam?.required_documents && exam.required_documents.length > 0 ? (
                  <ul className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC]">
                    {exam.required_documents.map((doc, i) => (
                      <li key={i} className="py-2 flex items-start gap-2 text-[#111111] leading-relaxed">
                        <span className="font-mono text-xs text-[#6E6D68] mt-0.5">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#6E6D68]">Chưa có danh sách tài liệu chi tiết.</p>
                )}
              </div>
            </div>
          )}

          {/* DRAWER TAB 3: PARTNER UNIVERSITIES & CONTACT */}
          {activeDrawerTab === 'partners' && (
            <div className="space-y-5 sm:space-y-6 text-xs sm:text-sm">
              <div>
                <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-2">
                  Trường Đại học liên kết ({exam?.partner_universities?.length || 0})
                </h3>
                {exam?.partner_universities && exam.partner_universities.length > 0 ? (
                  <ul className="divide-y divide-[#D6D4CC] border-t border-b border-[#111111]">
                    {exam.partner_universities.map((uni, i) => (
                      <li key={i} className="py-2 flex items-start gap-2 text-[#111111]">
                        <span className="font-mono text-xs text-[#6E6D68] mt-0.5">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <span>{uni}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#6E6D68]">Chưa có thông tin trường đại học liên kết.</p>
                )}
              </div>

              <div>
                <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-2">
                  Thông tin liên hệ trực tiếp
                </h3>
                <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC]">
                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <dt className="text-xs uppercase text-[#6E6D68] flex items-center gap-1.5 shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </dt>
                    <dd className="text-[#111111] truncate">
                      {isMeaningfulValue(exam?.contact_email) ? (
                        <a
                          href={`mailto:${exam!.contact_email}`}
                          className="underline underline-offset-4 hover:opacity-60 truncate block"
                        >
                          {exam!.contact_email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-3">
                    <dt className="text-xs uppercase text-[#6E6D68] flex items-center gap-1.5 shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Điện thoại</span>
                    </dt>
                    <dd className="text-[#111111]">
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
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="mt-6 pt-4 border-t border-[#111111] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <a
              href={school.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111111] underline underline-offset-4 hover:opacity-60"
            >
              Trang chủ ↗
            </a>
            {isMeaningfulValue(exam?.sample_tests_url) && (
              <a
                href={exam!.sample_tests_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#111111] underline underline-offset-4 hover:opacity-60"
              >
                Đề mẫu ↗
              </a>
            )}
          </div>

          <Link
            href={`/studienkollegs/${school.slug || school.id}`}
            className="px-3.5 py-2 bg-[#111111] text-[#F6F5F0] hover:opacity-85 transition-opacity text-xs"
          >
            Hồ sơ đầy đủ →
          </Link>
        </div>
      </aside>
    </div>
  );
}

