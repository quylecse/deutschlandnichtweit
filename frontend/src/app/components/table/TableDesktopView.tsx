'use client';

import Link from 'next/link';
import { ArrowUpDown, ArrowUpRight, MapPin } from 'lucide-react';
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
import { useTableFilterStore, type SortField } from '../../stores/useTableFilterStore';

interface Props {
  schools: Studienkolleg[];
  hasFilters: boolean;
  onOpenDrawer: (school: Studienkolleg) => void;
  onResetFilters: () => void;
}

export default function TableDesktopView({
  schools,
  hasFilters,
  onOpenDrawer,
  onResetFilters,
}: Props) {
  const { activeTableTab, toggleSort } = useTableFilterStore();

  return (
    <div className="hidden md:block border border-[#111111] bg-[#F6F5F0] overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#111111] bg-[#EFECE6] text-[11px] uppercase tracking-[0.12em] text-[#5A5955]">
            <th className="py-3.5 px-4 w-12">#</th>
            <th className="py-3.5 px-4 min-w-[240px]">
              <button
                type="button"
                onClick={() => toggleSort('name')}
                className="inline-flex items-center gap-1.5 hover:text-[#111111] cursor-pointer uppercase font-medium"
              >
                Trường Studienkolleg
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="py-3.5 px-4 min-w-[140px]">
              <button
                type="button"
                onClick={() => toggleSort('city')}
                className="inline-flex items-center gap-1.5 hover:text-[#111111] cursor-pointer uppercase font-medium"
              >
                Thành phố / Bang
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>

            {/* Dynamic Columns by Topic Tab */}
            {activeTableTab === 'exam' && (
              <>
                <th className="py-3.5 px-4 min-w-[120px] font-medium">Khối đào tạo</th>
                <th className="py-3.5 px-4 min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => toggleSort('exam_date')}
                    className="inline-flex items-center gap-1.5 hover:text-[#111111] cursor-pointer uppercase font-medium"
                  >
                    Lịch thi dự kiến
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[140px] font-medium">Hình thức thi</th>
              </>
            )}

            {activeTableTab === 'application' && (
              <>
                <th className="py-3.5 px-4 min-w-[170px] font-medium">Cổng nộp hồ sơ</th>
                <th className="py-3.5 px-4 min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => toggleSort('application_deadline')}
                    className="inline-flex items-center gap-1.5 hover:text-[#111111] cursor-pointer uppercase font-medium"
                  >
                    Hạn nộp hồ sơ
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[130px] font-medium">Lệ phí dự thi</th>
              </>
            )}

            {activeTableTab === 'partners' && (
              <>
                <th className="py-3.5 px-4 min-w-[140px] font-medium">Loại & Hệ trường</th>
                <th className="py-3.5 px-4 min-w-[220px] font-medium">Trường ĐH liên kết</th>
                <th className="py-3.5 px-4 min-w-[170px] font-medium">Liên hệ</th>
              </>
            )}

            <th className="py-3.5 px-4 text-right min-w-[110px] font-medium">Chi tiết</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#D6D4CC] text-sm">
          {schools.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-14 px-4 text-center text-[#6E6D68]">
                <p className="text-base text-[#111111] mb-1">Không tìm thấy trường phù hợp.</p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="mt-3 text-xs uppercase tracking-wider border border-[#111111] px-4 py-2 text-[#111111] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </td>
            </tr>
          ) : (
            schools.map((school, idx) => {
              const exam = school.entrance_exam_info;
              const hasSample = isMeaningfulValue(exam?.sample_tests_url);
              const fundingShort = formatFundingShort(exam?.funding_type);
              const modeInfo = formatExamModeShort(exam?.exam_mode);
              const portalInfo = formatPortalShort(exam?.application_portal);
              const feeShort = formatExamFeeShort(exam?.exam_fee);
              const partners = exam?.partner_universities || [];
              const germanLevel = extractGermanLevel(school);

              return (
                <tr
                  key={school.id}
                  onClick={() => onOpenDrawer(school)}
                  className="group hover:bg-[#EAE7DF] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-xs text-[#787772] align-middle">
                    {String(idx + 1).padStart(2, '0')}
                  </td>

                  <td className="py-3 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      <img
                        src={getCityImage(school.city)}
                        alt={school.city}
                        className="w-10 h-10 object-cover grayscale contrast-110 border border-[#111111] shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-[#111111] group-hover:underline underline-offset-4 line-clamp-1">
                          {school.name}
                        </div>
                        <span className="text-[11px] text-[#6E6D68] inline-flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {school.city}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 align-middle">
                    <span className="text-[#111111] font-medium">{school.city}</span>
                    <div className="text-xs text-[#6E6D68] flex items-center gap-1.5 mt-0.5">
                      <span>{school.state}</span>
                      {germanLevel !== '—' && (
                        <span
                          className="inline-block bg-[#111111] text-[#F6F5F0] px-1.5 py-0.2 text-[9px] font-mono font-medium"
                          title="Yêu cầu tiếng Đức tối thiểu"
                        >
                          {germanLevel}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* TAB 1: EXAM & COURSES */}
                  {activeTableTab === 'exam' && (
                    <>
                      <td className="py-4 px-4 align-middle text-xs font-medium text-[#111111]">
                        {formatCoursesCompact(exam?.courses_offered)}
                      </td>

                      <td className="py-4 px-4 align-middle text-xs">
                        <SemesterDateDisplay
                          raw={exam?.exam_date_raw}
                          context={exam?.raw_summary}
                        />
                      </td>

                      <td className="py-4 px-4 align-middle text-xs font-medium text-[#111111] whitespace-nowrap">
                        {modeInfo.label}
                      </td>
                    </>
                  )}

                  {/* TAB 2: APPLICATION & FEES */}
                  {activeTableTab === 'application' && (
                    <>
                      <td className="py-4 px-4 align-middle text-xs font-medium text-[#111111]">
                        {portalInfo.badge}
                      </td>

                      <td className="py-4 px-4 align-middle text-xs">
                        <SemesterDateDisplay
                          raw={exam?.application_deadline}
                          context={exam?.raw_summary}
                        />
                      </td>

                      <td className="py-4 px-4 align-middle text-xs font-medium text-[#111111]">
                        {feeShort}
                      </td>
                    </>
                  )}

                  {/* TAB 3: PARTNERS & CONTACT */}
                  {activeTableTab === 'partners' && (
                    <>
                      <td className="py-4 px-4 align-middle text-xs">
                        <span className="inline-block border border-[#111111] px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium text-[#111111]">
                          {fundingShort}
                        </span>
                        <span className="block text-[11px] text-[#5A5955] mt-1">
                          {formatTypeShort(school.type)}
                        </span>
                      </td>

                      <td className="py-4 px-4 align-middle text-xs">
                        {partners.length > 0 ? (
                          <div>
                            <span className="text-[#111111] font-medium line-clamp-1">
                              {partners[0]}
                            </span>
                            {partners.length > 1 && (
                              <span className="text-[11px] text-[#6E6D68] block mt-0.5">
                                +{partners.length - 1} trường đại học khác
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#9A9890]">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-middle text-xs">
                        {isMeaningfulValue(exam?.contact_email) ? (
                          <span className="text-[#111111] block truncate max-w-[180px]">
                            {exam!.contact_email}
                          </span>
                        ) : null}
                        {isMeaningfulValue(exam?.contact_phone) ? (
                          <span className="text-[11px] text-[#6E6D68] block">
                            {exam!.contact_phone}
                          </span>
                        ) : null}
                        {!isMeaningfulValue(exam?.contact_email) &&
                          !isMeaningfulValue(exam?.contact_phone) && (
                            <span className="text-[#9A9890]">—</span>
                          )}
                      </td>
                    </>
                  )}

                  <td
                    className="py-4 px-4 align-middle text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-3 text-xs">
                      {hasSample && activeTableTab === 'exam' && (
                        <a
                          href={exam!.sample_tests_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#111111] underline underline-offset-4 hover:opacity-60"
                        >
                          Đề mẫu ↗
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenDrawer(school)}
                        className="text-[#111111] font-medium hover:underline underline-offset-4 cursor-pointer"
                      >
                        Xem nhanh
                      </button>
                      <Link
                        href={`/studienkollegs/${school.slug || school.id}`}
                        className="text-[#6E6D68] hover:text-[#111111] inline-flex items-center"
                        title="Mở trang chi tiết"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

