'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTableFilterStore } from '../../stores/useTableFilterStore';

interface Props {
  states: string[];
  courses: string[];
  subjects: string[];
}

export default function TableFilterBar({ states, courses, subjects }: Props) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    setSearchQuery,
    setSelectedState,
    setSelectedType,
    setSelectedFunding,
    setSelectedGermanLevel,
    setSelectedCourse,
    setSelectedSubject,
    setOnlyWithExamDate,
    setOnlyWithSampleTests,
    resetFilters,
    getActiveFiltersCount,
  } = useTableFilterStore();

  const activeFiltersCount = getActiveFiltersCount();
  const hasFilters = searchQuery !== '' || activeFiltersCount > 0;

  return (
    <div className="border border-[#111111] bg-[#F6F5F0] mb-4 sm:mb-6">
      {/* Search & Mobile Filter Toggle Bar */}
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
          <div className="col-span-1 md:col-span-2 p-3">
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

          {/* German Language Level */}
          <div className="col-span-1 md:col-span-2 p-3">
            <label
              htmlFor="filter-german"
              className="text-[10px] uppercase tracking-[0.14em] text-[#6E6D68] mb-1 block"
            >
              Tiếng Đức
            </label>
            <select
              id="filter-german"
              value={selectedGermanLevel}
              onChange={(e) => setSelectedGermanLevel(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-[#111111] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trình độ</option>
              <option value="B1">Yêu cầu B1</option>
              <option value="B2">Yêu cầu B2</option>
              <option value="C1">Yêu cầu C1</option>
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
          <div className="col-span-1 md:col-span-2 p-3">
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
              onClick={resetFilters}
              className="text-[11px] underline underline-offset-4 text-[#111111] hover:opacity-70 cursor-pointer ml-auto"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

