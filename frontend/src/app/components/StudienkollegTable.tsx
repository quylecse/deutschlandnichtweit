'use client';

import { useState, useMemo, useEffect } from 'react';
import { Studienkolleg } from '../types/studienkolleg';
import {
  isMeaningfulValue,
  extractSortableTimestamp,
  extractGermanLevel,
} from '../lib/studienkollegs';
import {
  useTableFilterStore,
  type SortField,
  type TableTab,
} from '../stores/useTableFilterStore';
import { useStudienkollegsQuery } from '../hooks/useStudienkollegs';
import TableFilterBar from './table/TableFilterBar';
import TableDesktopView from './table/TableDesktopView';
import TableMobileView from './table/TableMobileView';
import SchoolDetailDrawer, { type DrawerTab } from './table/SchoolDetailDrawer';

interface Props {
  schools: Studienkolleg[];
  showHeader?: boolean;
  initialCourse?: string;
}

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
  const {
    searchQuery,
    selectedState,
    selectedType,
    selectedFunding,
    selectedGermanLevel,
    selectedCourse,
    selectedSubject,
    onlyWithExamDate,
    onlyWithSampleTests,
    sortField,
    sortOrder,
    activeTableTab,
    setSelectedCourse,
    setActiveTableTab,
    resetFilters,
    getActiveFiltersCount,
  } = useTableFilterStore();

  const [selectedSchool, setSelectedSchool] = useState<Studienkolleg | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('overview');

  const { data: schoolList = schools } = useStudienkollegsQuery(schools);

  useEffect(() => {
    if (initialCourse && initialCourse !== 'ALL') {
      setSelectedCourse(initialCourse);
    }
  }, [initialCourse, setSelectedCourse]);

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
    schoolList.forEach((item) => {
      if (item.state) s.add(item.state);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'));
  }, [schoolList]);

  const courses = useMemo(() => {
    const s = new Set<string>();
    schoolList.forEach((item) => {
      item.entrance_exam_info?.courses_offered?.forEach((c) => s.add(c));
    });
    return Array.from(s).sort();
  }, [schoolList]);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    schoolList.forEach((item) => {
      item.entrance_exam_info?.subjects?.forEach((sub) => {
        if (isMeaningfulValue(sub)) s.add(sub.trim());
      });
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [schoolList]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = schoolList.filter((school) => {
      const exam = school.entrance_exam_info;
      const matchesSearch =
        !q ||
        school.name.toLowerCase().includes(q) ||
        school.city.toLowerCase().includes(q) ||
        school.state.toLowerCase().includes(q) ||
        exam?.partner_universities?.some((p) => p.toLowerCase().includes(q)) ||
        exam?.courses_offered?.some((c) => c.toLowerCase().includes(q));

      const matchesState = selectedState === 'ALL' || school.state === selectedState;
      const matchesType = selectedType === 'ALL' || school.type === selectedType;
      const matchesFunding =
        selectedFunding === 'ALL' ||
        (selectedFunding === 'PUBLIC' &&
          (exam?.funding_type === 'Công lập' ||
            exam?.funding_type?.toLowerCase().includes('public') ||
            !exam?.funding_type)) ||
        (selectedFunding === 'PRIVATE' &&
          (exam?.funding_type === 'Tư nhân' ||
            exam?.funding_type?.toLowerCase().includes('private')));

      const matchesCourse =
        selectedCourse === 'ALL' ||
        exam?.courses_offered?.some(
          (c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()
        );

      const matchesSubject =
        selectedSubject === 'ALL' ||
        exam?.subjects?.some(
          (s) => s.toLowerCase().trim() === selectedSubject.toLowerCase().trim()
        );

      const matchesExamDate =
        !onlyWithExamDate || isMeaningfulValue(exam?.exam_date_raw);
      const matchesSample =
        !onlyWithSampleTests || isMeaningfulValue(exam?.sample_tests_url);

      const level = extractGermanLevel(school);
      const matchesGerman =
        selectedGermanLevel === 'ALL' ||
        (selectedGermanLevel === 'B1' && (level === 'B1' || level === 'B1/B2')) ||
        (selectedGermanLevel === 'B2' && (level === 'B2' || level === 'B1/B2')) ||
        (selectedGermanLevel === 'C1' && level === 'C1');

      return (
        matchesSearch &&
        matchesState &&
        matchesType &&
        matchesFunding &&
        matchesGerman &&
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
      if (sortField === 'exam_date' || sortField === 'application_deadline') {
        const rawA =
          sortField === 'exam_date'
            ? a.entrance_exam_info?.exam_date_raw
            : a.entrance_exam_info?.application_deadline;
        const rawB =
          sortField === 'exam_date'
            ? b.entrance_exam_info?.exam_date_raw
            : b.entrance_exam_info?.application_deadline;

        const timeA = extractSortableTimestamp(rawA);
        const timeB = extractSortableTimestamp(rawB);

        if (timeA !== null && timeB !== null) {
          if (timeA !== timeB) return (timeA - timeB) * dir;
          return a.name.localeCompare(b.name, 'de');
        }
        if (timeA !== null || timeB !== null) {
          return timeA !== null ? -1 : 1;
        }

        const aHas = isMeaningfulValue(rawA);
        const bHas = isMeaningfulValue(rawB);
        if (aHas !== bHas) return aHas ? -1 : 1;
        return (rawA || '').localeCompare(rawB || '', 'de') * dir;
      }
      return 0;
    });
  }, [
    schoolList,
    searchQuery,
    selectedState,
    selectedType,
    selectedFunding,
    selectedGermanLevel,
    selectedCourse,
    selectedSubject,
    onlyWithExamDate,
    onlyWithSampleTests,
    sortField,
    sortOrder,
  ]);

  const activeFiltersCount = getActiveFiltersCount();
  const hasFilters = searchQuery !== '' || activeFiltersCount > 0;

  return (
    <div className="w-full">
      {/* SECTION HEADER: Editorial Swiss Typographic Style */}
      {showHeader && (
        <div className="mb-6 sm:mb-8 border-b border-[#111111] pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[#111111]" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#6E6D68]">
                  Cơ sở dữ liệu tuyển sinh 2026/2027
                </span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-4xl lg:text-5xl text-[#111111] tracking-tight">
                Danh mục Studienkolleg Đức
              </h2>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl sm:text-3xl text-[#111111] block">
                {filteredAndSorted.length}
                <span className="text-[#6E6D68] text-base font-sans">
                  /{schoolList.length} trường
                </span>
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#6E6D68]">
                Dữ liệu chuẩn hóa tự động
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR MODULE */}
      <TableFilterBar states={states} courses={courses} subjects={subjects} />

      {/* TOPIC SWITCHER TABS */}
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

      {/* DESKTOP TABLE MODULE */}
      <TableDesktopView
        schools={filteredAndSorted}
        hasFilters={hasFilters}
        onOpenDrawer={openSchoolDrawer}
        onResetFilters={resetFilters}
      />

      {/* MOBILE CARDS MODULE */}
      <TableMobileView
        schools={filteredAndSorted}
        hasFilters={hasFilters}
        onOpenDrawer={openSchoolDrawer}
        onResetFilters={resetFilters}
      />

      {/* SCHOOL DETAIL DRAWER MODULE */}
      <SchoolDetailDrawer
        school={selectedSchool}
        activeDrawerTab={activeDrawerTab}
        setActiveDrawerTab={setActiveDrawerTab}
        onClose={() => setSelectedSchool(null)}
      />
    </div>
  );
}
