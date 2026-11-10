'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Studienkolleg } from '../../types/studienkolleg';
import { getCityImage } from '../../lib/schoolImages';
import {
  extractGermanLevel,
  formatCoursesCompact,
  formatExamFeeShort,
  formatExamModeShort,
  formatFundingShort,
  formatPortalShort,
  formatTypeShort,
  isMeaningfulValue,
} from '../../lib/studienkollegs';
import SemesterDateDisplay from '../SemesterDateDisplay';
import { useTableFilterStore } from '../../stores/useTableFilterStore';

interface Props {
  schools: Studienkolleg[];
  hasFilters: boolean;
  onOpenDrawer: (school: Studienkolleg) => void;
  onResetFilters: () => void;
}

export default function TableMobileView({
  schools,
  hasFilters,
  onOpenDrawer,
  onResetFilters,
}: Props) {
  const { activeTableTab } = useTableFilterStore();

  return (
    <div className="md:hidden border-x border-b border-[#111111] divide-y divide-[#D6D4CC] bg-[#F6F5F0]">
      {schools.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#6E6D68]">
          <p className="text-sm text-[#111111] mb-2 font-medium">Không tìm thấy trường.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 text-xs border border-[#111111] px-3 py-1.5 text-[#111111]"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        schools.map((school, idx) => {
          const exam = school.entrance_exam_info;
          const fundingShort = formatFundingShort(exam?.funding_type);
          const portalInfo = formatPortalShort(exam?.application_portal);
          const feeShort = formatExamFeeShort(exam?.exam_fee);
          const partners = exam?.partner_universities || [];
          const germanLevel = extractGermanLevel(school);

          return (
            <div
              key={school.id}
              onClick={() => onOpenDrawer(school)}
              className="p-3.5 sm:p-4 active:bg-[#EAE7DF] transition-colors cursor-pointer"
            >
              {/* Header row: Index, City/State, German Level + Funding badge */}
              <div className="flex items-center justify-between text-[11px] text-[#6E6D68] mb-2">
                <span className="font-mono">
                  {String(idx + 1).padStart(2, '0')}. {school.city} · {school.state}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {germanLevel !== '—' && (
                    <span className="bg-[#111111] text-[#F6F5F0] px-1.5 py-0.2 text-[9px] font-mono font-medium">
                      {germanLevel}
                    </span>
                  )}
                  <span className="border border-[#111111] px-1.5 py-0.2 text-[9px] uppercase font-medium text-[#111111]">
                    {fundingShort}
                  </span>
                </div>
              </div>

              {/* School Name with Thumbnail */}
              <div className="flex items-start gap-3 mb-2.5">
                <img
                  src={getCityImage(school.city)}
                  alt={school.city}
                  className="w-12 h-12 object-cover grayscale contrast-110 border border-[#111111] shrink-0 mt-0.5"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <h3 className="font-editorial text-base sm:text-lg text-[#111111] leading-snug line-clamp-2">
                    {school.name}
                  </h3>
                </div>
              </div>

              {/* Dynamic Content by Active Tab */}
              {activeTableTab === 'exam' && (
                <div className="space-y-1.5 text-xs bg-[#EFECE6]/70 p-2.5 border border-[#D6D4CC]">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[#6E6D68] text-[11px]">Khối đào tạo:</span>
                    <span className="font-medium text-[#111111]">
                      {formatCoursesCompact(exam?.courses_offered)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[#6E6D68] text-[11px] shrink-0">Lịch thi:</span>
                    <SemesterDateDisplay
                      raw={exam?.exam_date_raw}
                      context={exam?.raw_summary}
                      className="text-right"
                    />
                  </div>
                </div>
              )}

              {activeTableTab === 'application' && (
                <div className="space-y-1.5 text-xs bg-[#EFECE6]/70 p-2.5 border border-[#D6D4CC]">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[#6E6D68] text-[11px] shrink-0">Cổng nộp:</span>
                    <span className="font-medium text-[#111111] text-right truncate">
                      {portalInfo.badge}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[#6E6D68] text-[11px] shrink-0">Hạn nộp:</span>
                    <SemesterDateDisplay
                      raw={exam?.application_deadline}
                      context={exam?.raw_summary}
                      className="text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[#6E6D68] text-[11px]">Lệ phí thi:</span>
                    <span className="font-medium text-[#111111]">{feeShort}</span>
                  </div>
                </div>
              )}

              {activeTableTab === 'partners' && (
                <div className="space-y-1.5 text-xs bg-[#EFECE6]/70 p-2.5 border border-[#D6D4CC]">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[#6E6D68] text-[11px] shrink-0">Hệ trường:</span>
                    <span className="text-[#111111]">{formatTypeShort(school.type)}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[#6E6D68] text-[11px] shrink-0">ĐH liên kết:</span>
                    <span className="text-right text-[#111111] font-medium truncate max-w-[200px]">
                      {partners.length > 0 ? `${partners[0]} (${partners.length})` : '—'}
                    </span>
                  </div>
                  {(isMeaningfulValue(exam?.contact_email) ||
                    isMeaningfulValue(exam?.contact_phone)) && (
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[#6E6D68] text-[11px]">Liên hệ:</span>
                      <span className="text-right text-[#111111] truncate max-w-[200px]">
                        {exam?.contact_email || exam?.contact_phone}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer action row */}
              <div className="mt-2.5 flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-[#6E6D68] inline-flex items-center gap-1">
                  Nhấn để xem chi tiết <ChevronRight className="w-3 h-3" />
                </span>
                <Link
                  href={`/studienkollegs/${school.slug || school.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#111111] font-medium underline underline-offset-2 inline-flex items-center gap-0.5"
                >
                  Trang hồ sơ <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

