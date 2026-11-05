'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Filter,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Studienkolleg } from '../types/studienkolleg';
import { getCityImage } from '../lib/schoolImages';
import {
  formatCoursesCompact,
  formatExamFeeShort,
  formatExamModeShort,
  formatFundingShort,
  formatPortalShort,
  formatTypeShort,
  formatValue,
  isMeaningfulValue,
} from '../lib/studienkollegs';
import SemesterDateDisplay from './SemesterDateDisplay';
import {
  StructuredSentenceList,
  StructuredSteps,
  StructuredSummary,
  SubjectListFormatted,
} from './StructuredText';

interface Props {
  schools: Studienkolleg[];
  showHeader?: boolean;
  initialCourse?: string;
}

type SortField = 'name' | 'city' | 'state' | 'exam_date';
type SortOrder = 'asc' | 'desc';
type TableTab = 'exam' | 'application' | 'partners';
type DrawerTab = 'overview' | 'application' | 'partners';

const TABLE_TABS: { id: TableTab; code: string; label: string; desc: string }[] = [
  {
    id: 'exam',
    code: '01',
    label: 'Lịch thi & Khối',
    desc: 'Khối đào tạo, ngày thi Aufnahmetest & hình thức thi',
  },
  {
    id: 'application',
    code: '02',
    label: 'Hồ sơ & Lệ phí',
    desc: 'Cổng nộp (Uni-Assist/Portal), hạn nộp & lệ phí',
  },
  {
    id: 'partners',
    code: '03',
    label: 'ĐH & Liên hệ',
    desc: 'Loại trường, danh sách ĐH liên kết, Email & SĐT',
  },
];

export default function StudienkollegTable({
  schools,
  showHeader = true,
  initialCourse = 'ALL',
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedFunding, setSelectedFunding] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [onlyWithExamDate, setOnlyWithExamDate] = useState(false);
  const [onlyWithSampleTests, setOnlyWithSampleTests] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [activeTableTab, setActiveTableTab] = useState<TableTab>('exam');
  const [selectedSchool, setSelectedSchool] = useState<Studienkolleg | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('overview');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setSelectedCourse(initialCourse);
  }, [initialCourse]);

  const openSchoolDrawer = (school: Studienkolleg, defaultTab?: DrawerTab) => {
    setSelectedSchool(school);
    if (defaultTab) {
      setActiveDrawerTab(defaultTab);
    } else if (activeTableTab === 'application') {
      setActiveDrawerTab('application');
    } else if (activeTableTab === 'partners') {
      setActiveDrawerTab('partners');
    } else {
      setActiveDrawerTab('overview');
    }
  };

  const states = useMemo(() => {
    const s = new Set<string>();
    schools.forEach((item) => {
      if (item.state) s.add(item.state);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'));
  }, [schools]);

  const courses = useMemo(() => {
    const s = new Set<string>();
    schools.forEach((item) => {
      item.entrance_exam_info?.courses_offered?.forEach((c) => s.add(c));
    });
    return Array.from(s).sort();
  }, [schools]);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    schools.forEach((item) => {
      item.entrance_exam_info?.subjects?.forEach((sub) => {
        if (isMeaningfulValue(sub)) s.add(sub.trim());
      });
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [schools]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = schools.filter((school) => {
      const exam = school.entrance_exam_info;
      const matchesSearch =
        !q ||
        school.name.toLowerCase().includes(q) ||
        school.city.toLowerCase().includes(q) ||
        school.state.toLowerCase().includes(q) ||
        (exam?.raw_summary && exam.raw_summary.toLowerCase().includes(q)) ||
        (exam?.application_portal && exam.application_portal.toLowerCase().includes(q)) ||
        (exam?.exam_mode && exam.exam_mode.toLowerCase().includes(q)) ||
        (exam?.subjects && exam.subjects.some((sub) => sub.toLowerCase().includes(q))) ||
        (exam?.partner_universities &&
          exam.partner_universities.some((uni) => uni.toLowerCase().includes(q)));

      const matchesState = selectedState === 'ALL' || school.state === selectedState;
      const matchesType = selectedType === 'ALL' || school.type === selectedType;
      const matchesFunding =
        selectedFunding === 'ALL' ||
        (selectedFunding === 'PUBLIC' &&
          formatFundingShort(exam?.funding_type) === 'Công lập') ||
        (selectedFunding === 'PRIVATE' &&
          formatFundingShort(exam?.funding_type) === 'Tư nhân');
      const matchesCourse =
        selectedCourse === 'ALL' ||
        Boolean(exam?.courses_offered && exam.courses_offered.includes(selectedCourse));
      const matchesSubject =
        selectedSubject === 'ALL' ||
        Boolean(exam?.subjects && exam.subjects.includes(selectedSubject));
      const matchesExamDate = !onlyWithExamDate || isMeaningfulValue(exam?.exam_date_raw);
      const matchesSample = !onlyWithSampleTests || isMeaningfulValue(exam?.sample_tests_url);

      return (
        matchesSearch &&
        matchesState &&
        matchesType &&
        matchesFunding &&
        matchesCourse &&
        matchesSubject &&
        matchesExamDate &&
        matchesSample
      );
    });

    return [...filtered].sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'name') {
        return a.name.localeCompare(b.name, 'de') * dir;
      }
      if (sortField === 'city') {
        return a.city.localeCompare(b.city, 'de') * dir;
      }
      if (sortField === 'state') {
        return a.state.localeCompare(b.state, 'de') * dir;
      }
      if (sortField === 'exam_date') {
        const aHas = isMeaningfulValue(a.entrance_exam_info?.exam_date_raw);
        const bHas = isMeaningfulValue(b.entrance_exam_info?.exam_date_raw);
        if (aHas !== bHas) return aHas ? -1 : 1;
        const aVal = a.entrance_exam_info?.exam_date_raw || '';
        const bVal = b.entrance_exam_info?.exam_date_raw || '';
        return aVal.localeCompare(bVal, 'de') * dir;
      }
      return 0;
    });
  }, [
    schools,
    searchQuery,
    selectedState,
    selectedType,
    selectedFunding,
    selectedCourse,
    selectedSubject,
    onlyWithExamDate,
    onlyWithSampleTests,
    sortField,
    sortOrder,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const activeFiltersCount = [
    selectedState !== 'ALL',
    selectedType !== 'ALL',
    selectedFunding !== 'ALL',
    selectedCourse !== 'ALL',
    selectedSubject !== 'ALL',
    onlyWithExamDate,
    onlyWithSampleTests,
  ].filter(Boolean).length;

  const hasFilters = searchQuery !== '' || activeFiltersCount > 0;

  const resetAll = () => {
    setSearchQuery('');
    setSelectedState('ALL');
    setSelectedType('ALL');
    setSelectedFunding('ALL');
    setSelectedCourse('ALL');
    setSelectedSubject('ALL');
    setOnlyWithExamDate(false);
    setOnlyWithSampleTests(false);
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#6E6D68] mb-1.5 sm:mb-2">
              Danh bạ toàn liên bang
            </p>
            <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl tracking-tight text-[#111111]">
              Bảng tra cứu Studienkolleg
            </h2>
          </div>
          <div className="text-xs text-[#6E6D68] flex items-center justify-between sm:justify-end gap-2">
            <span>
              <strong className="text-[#111111]">{filteredAndSorted.length}</strong> /{' '}
              {schools.length} trường
            </span>
          </div>
        </div>
      )}

      {/* Search & Mobile Filter Toggle Bar */}
      <div className="border border-[#111111] bg-[#F6F5F0] mb-4 sm:mb-6">
        <div className="p-3 sm:p-4 flex items-center gap-2">
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 text-[#6E6D68] mr-2 shrink-0" />
            <input
              id="table-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên trường, thành phố, ĐH..."
              className="w-full bg-transparent text-xs sm:text-sm text-[#111111] placeholder:text-[#9A9890] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-[#6E6D68] hover:text-[#111111] cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters((prev) => !prev)}
            className={`md:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 border text-xs cursor-pointer transition-colors ${
              activeFiltersCount > 0 || showMobileFilters
                ? 'bg-[#111111] text-[#F6F5F0] border-[#111111]'
                : 'border-[#111111] bg-[#F6F5F0] text-[#111111]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Lọc</span>
            {activeFiltersCount > 0 && (
              <span className="bg-[#F6F5F0] text-[#111111] text-[10px] w-4 h-4 rounded-full inline-flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filters: Always visible on desktop, toggleable on mobile */}
        <div
          className={`${
            showMobileFilters ? 'block' : 'hidden md:block'
          } border-t border-[#D6D4CC]`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#D6D4CC]">
            {/* State */}
            <div className="col-span-1 md:col-span-3 p-3">
              <label
                htmlFor="filter-state"
                className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 block"
              >
                Bang
              </label>
              <select
                id="filter-state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#111111] focus:outline-none cursor-pointer truncate"
              >
                <option value="ALL">Tất cả bang ({states.length})</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Funding Type */}
            <div className="col-span-1 md:col-span-2 p-3">
              <label
                htmlFor="filter-funding"
                className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 block"
              >
                Loại trường
              </label>
              <select
                id="filter-funding"
                value={selectedFunding}
                onChange={(e) => setSelectedFunding(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#111111] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả</option>
                <option value="PUBLIC">Công lập</option>
                <option value="PRIVATE">Tư nhân</option>
              </select>
            </div>

            {/* Type */}
            <div className="col-span-1 md:col-span-2 p-3">
              <label
                htmlFor="filter-type"
                className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 block"
              >
                Hệ trường
              </label>
              <select
                id="filter-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#111111] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả</option>
                <option value="UNIVERSITAET">Universität</option>
                <option value="FACHHOCHSCHULE">Fachhochschule</option>
                <option value="BOTH">Uni & FH</option>
              </select>
            </div>

            {/* Course */}
            <div className="col-span-1 md:col-span-2 p-3">
              <label
                htmlFor="filter-course"
                className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 block"
              >
                Khối học
              </label>
              <select
                id="filter-course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#111111] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả khối</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="col-span-2 sm:col-span-2 md:col-span-3 p-3">
              <label
                htmlFor="filter-subject"
                className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 block"
              >
                Môn thi
              </label>
              <select
                id="filter-subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#111111] focus:outline-none cursor-pointer truncate"
              >
                <option value="ALL">Tất cả môn ({subjects.length})</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick toggle chips */}
          <div className="border-t border-[#D6D4CC] px-3 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#EFECE6]/60 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[#111111]">
                <input
                  type="checkbox"
                  checked={onlyWithExamDate}
                  onChange={(e) => setOnlyWithExamDate(e.target.checked)}
                  className="accent-[#111111] w-3.5 h-3.5 rounded-none"
                />
                <span className="text-[11px] sm:text-xs">Đã có lịch thi</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[#111111]">
                <input
                  type="checkbox"
                  checked={onlyWithSampleTests}
                  onChange={(e) => setOnlyWithSampleTests(e.target.checked)}
                  className="accent-[#111111] w-3.5 h-3.5 rounded-none"
                />
                <span className="text-[11px] sm:text-xs">Có đề thi mẫu</span>
              </label>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="text-[11px] underline underline-offset-4 text-[#111111] hover:opacity-70 cursor-pointer ml-auto"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Topic Switcher Tabs (3 columns on desktop, pill row on mobile) */}
      <div className="grid grid-cols-3 border-x border-t border-[#111111] divide-x divide-[#111111] bg-[#F6F5F0]">
        {TABLE_TABS.map((tab) => {
          const isActive = activeTableTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTableTab(tab.id)}
              className={`p-2.5 sm:p-4 text-left transition-colors cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-[#111111] text-[#F6F5F0]'
                  : 'bg-[#F6F5F0] text-[#111111] hover:bg-[#EAE7DF]'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-[0.14em] mb-1">
                <span className={isActive ? 'text-[#C8C5BC]' : 'text-[#6E6D68]'}>
                  {tab.code}
                </span>
                {isActive && (
                  <span className="hidden sm:inline-block px-1.5 py-0.2 border border-[#F6F5F0]/40 text-[9px]">
                    Đang xem
                  </span>
                )}
              </div>
              <div className="font-editorial text-sm sm:text-lg lg:text-xl leading-tight truncate">
                {tab.label}
              </div>
              <p
                className={`hidden md:block text-[11px] mt-1 line-clamp-1 ${
                  isActive ? 'text-[#C8C5BC]' : 'text-[#6E6D68]'
                }`}
              >
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Data Table (Hidden on small screens) */}
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
                  <th className="py-3.5 px-4 min-w-[160px] font-medium">Hạn nộp hồ sơ</th>
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
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 px-4 text-center text-[#6E6D68]">
                  <p className="text-base text-[#111111] mb-1">Không tìm thấy trường phù hợp.</p>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={resetAll}
                      className="mt-3 text-xs uppercase tracking-wider border border-[#111111] px-4 py-2 text-[#111111] hover:bg-[#111111] hover:text-[#F6F5F0] transition-colors cursor-pointer"
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((school, idx) => {
                const exam = school.entrance_exam_info;
                const hasSample = isMeaningfulValue(exam?.sample_tests_url);
                const fundingShort = formatFundingShort(exam?.funding_type);
                const modeInfo = formatExamModeShort(exam?.exam_mode);
                const portalInfo = formatPortalShort(exam?.application_portal);
                const feeShort = formatExamFeeShort(exam?.exam_fee);
                const partners = exam?.partner_universities || [];

                return (
                  <tr
                    key={school.id}
                    onClick={() => openSchoolDrawer(school)}
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
                      <span className="text-xs text-[#6E6D68] block">{school.state}</span>
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

                        <td className="py-4 px-4 align-middle text-xs">
                          <span className="inline-block border border-[#111111] px-2 py-0.5 text-[11px] font-medium text-[#111111]">
                            {modeInfo.label}
                          </span>
                          {modeInfo.sub && (
                            <span className="block text-[11px] text-[#6E6D68] mt-0.5">
                              {modeInfo.sub}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* TAB 2: APPLICATION & FEES */}
                    {activeTableTab === 'application' && (
                      <>
                        <td className="py-4 px-4 align-middle text-xs">
                          <span className="inline-block border border-[#111111] bg-[#EFECE6] px-2 py-0.5 text-[11px] font-medium text-[#111111]">
                            {portalInfo.badge}
                          </span>
                          {exam?.required_documents && exam.required_documents.length > 0 && (
                            <span className="block text-[11px] text-[#6E6D68] mt-1">
                              {exam.required_documents.length} mục hồ sơ yêu cầu
                            </span>
                          )}
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
                          onClick={() => openSchoolDrawer(school)}
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

      {/* MOBILE VIEW: Compact Card List (Clean, best practice, no horizontal scroll) */}
      <div className="md:hidden border-x border-b border-[#111111] divide-y divide-[#D6D4CC] bg-[#F6F5F0]">
        {filteredAndSorted.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6E6D68]">
            <p className="text-sm text-[#111111] mb-2 font-medium">Không tìm thấy trường.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="mt-2 text-xs border border-[#111111] px-3 py-1.5 text-[#111111]"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredAndSorted.map((school, idx) => {
            const exam = school.entrance_exam_info;
            const fundingShort = formatFundingShort(exam?.funding_type);
            const modeInfo = formatExamModeShort(exam?.exam_mode);
            const portalInfo = formatPortalShort(exam?.application_portal);
            const feeShort = formatExamFeeShort(exam?.exam_fee);
            const partners = exam?.partner_universities || [];

            return (
              <div
                key={school.id}
                onClick={() => openSchoolDrawer(school)}
                className="p-3.5 sm:p-4 active:bg-[#EAE7DF] transition-colors cursor-pointer"
              >
                {/* Header row: Index, City/State, Funding badge */}
                <div className="flex items-center justify-between text-[11px] text-[#6E6D68] mb-2">
                  <span className="font-mono">{String(idx + 1).padStart(2, '0')}. {school.city} · {school.state}</span>
                  <span className="border border-[#111111] px-1.5 py-0.2 text-[9px] uppercase font-medium text-[#111111]">
                    {fundingShort}
                  </span>
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
                    {(isMeaningfulValue(exam?.contact_email) || isMeaningfulValue(exam?.contact_phone)) && (
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

      {/* Quick Preview Side Sheet (Drawer with Topic Tabs) */}
      {selectedSchool && (
        <div
          className="fixed inset-0 z-50 bg-[#111111]/50 backdrop-blur-xs flex justify-end"
          onClick={() => setSelectedSchool(null)}
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
                    {selectedSchool.city} · {selectedSchool.state}
                  </span>
                  <span className="border border-[#111111] px-1.5 py-0.2 text-[9px] uppercase font-medium text-[#111111] shrink-0">
                    {formatFundingShort(selectedSchool.entrance_exam_info?.funding_type)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSchool(null)}
                  className="text-xs uppercase tracking-wider text-[#111111] hover:opacity-60 cursor-pointer p-1"
                >
                  Đóng [×]
                </button>
              </div>

              {/* School Header with Campus Thumbnail */}
              <div className="flex items-start gap-4 mb-5 sm:mb-6">
                <img
                  src={getCityImage(selectedSchool.city)}
                  alt={selectedSchool.city}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover grayscale contrast-115 border border-[#111111] shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-editorial text-xl sm:text-2xl lg:text-3xl text-[#111111] leading-tight mb-1">
                    {selectedSchool.name}
                  </h2>
                  <span className="text-xs text-[#6E6D68] inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {selectedSchool.city}, bang {selectedSchool.state}
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
                        {formatValue(selectedSchool.entrance_exam_info?.funding_type, 'Công lập')} ·{' '}
                        {formatTypeShort(selectedSchool.type)}
                      </dd>
                    </div>

                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Khối học</dt>
                      <dd className="col-span-2 text-[#111111] font-medium">
                        {selectedSchool.entrance_exam_info?.courses_offered?.join(', ') || '—'}
                      </dd>
                    </div>

                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Môn thi</dt>
                      <dd className="col-span-2 text-[#111111]">
                        <SubjectListFormatted
                          subjects={selectedSchool.entrance_exam_info?.subjects}
                        />
                      </dd>
                    </div>

                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Hình thức thi</dt>
                      <dd className="col-span-2 text-[#111111]">
                        <StructuredSentenceList
                          text={selectedSchool.entrance_exam_info?.exam_mode}
                        />
                      </dd>
                    </div>

                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Lịch thi</dt>
                      <dd className="col-span-2 text-[#111111]">
                        <SemesterDateDisplay
                          raw={selectedSchool.entrance_exam_info?.exam_date_raw}
                          context={selectedSchool.entrance_exam_info?.raw_summary}
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
                      text={selectedSchool.entrance_exam_info?.raw_summary}
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
                    <StructuredSteps
                      text={selectedSchool.entrance_exam_info?.application_portal}
                    />
                  </div>

                  <dl className="divide-y divide-[#D6D4CC] border-t border-b border-[#111111]">
                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Hạn nộp</dt>
                      <dd className="col-span-2 text-[#111111]">
                        <StructuredSentenceList
                          text={selectedSchool.entrance_exam_info?.application_deadline}
                        />
                      </dd>
                    </div>

                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Lệ phí hồ sơ</dt>
                      <dd className="col-span-2 text-[#111111]">
                        <StructuredSentenceList
                          text={selectedSchool.entrance_exam_info?.application_fee}
                        />
                      </dd>
                    </div>

                    <div className="py-2.5 sm:py-3 grid grid-cols-3 gap-2 sm:gap-4">
                      <dt className="text-[11px] sm:text-xs uppercase text-[#6E6D68]">Lệ phí thi</dt>
                      <dd className="col-span-2 text-[#111111]">
                        <StructuredSentenceList
                          text={selectedSchool.entrance_exam_info?.exam_fee}
                        />
                      </dd>
                    </div>
                  </dl>

                  <div>
                    <h3 className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-[#6E6D68] mb-2">
                      Danh sách tài liệu cần nộp khi đăng ký
                    </h3>
                    {selectedSchool.entrance_exam_info?.required_documents &&
                    selectedSchool.entrance_exam_info.required_documents.length > 0 ? (
                      <ul className="divide-y divide-[#D6D4CC] border-t border-b border-[#D6D4CC]">
                        {selectedSchool.entrance_exam_info.required_documents.map((doc, i) => (
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
                      Trường Đại học liên kết (
                      {selectedSchool.entrance_exam_info?.partner_universities?.length || 0})
                    </h3>
                    {selectedSchool.entrance_exam_info?.partner_universities &&
                    selectedSchool.entrance_exam_info.partner_universities.length > 0 ? (
                      <ul className="divide-y divide-[#D6D4CC] border-t border-b border-[#111111]">
                        {selectedSchool.entrance_exam_info.partner_universities.map((uni, i) => (
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
                          {isMeaningfulValue(selectedSchool.entrance_exam_info?.contact_email) ? (
                            <a
                              href={`mailto:${selectedSchool.entrance_exam_info!.contact_email}`}
                              className="underline underline-offset-4 hover:opacity-60 truncate block"
                            >
                              {selectedSchool.entrance_exam_info!.contact_email}
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
                          {isMeaningfulValue(selectedSchool.entrance_exam_info?.contact_phone) ? (
                            <a
                              href={`tel:${selectedSchool.entrance_exam_info!.contact_phone}`}
                              className="underline underline-offset-4 hover:opacity-60"
                            >
                              {selectedSchool.entrance_exam_info!.contact_phone}
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
                  href={selectedSchool.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#111111] underline underline-offset-4 hover:opacity-60"
                >
                  Trang chủ ↗
                </a>
                {isMeaningfulValue(selectedSchool.entrance_exam_info?.sample_tests_url) && (
                  <a
                    href={selectedSchool.entrance_exam_info!.sample_tests_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#111111] underline underline-offset-4 hover:opacity-60"
                  >
                    Đề mẫu ↗
                  </a>
                )}
              </div>

              <Link
                href={`/studienkollegs/${selectedSchool.slug || selectedSchool.id}`}
                className="px-3.5 py-2 bg-[#111111] text-[#F6F5F0] hover:opacity-85 transition-opacity text-xs"
              >
                Hồ sơ đầy đủ →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
