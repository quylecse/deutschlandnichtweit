import { create } from 'zustand';

export type SortField =
    | 'name'
    | 'city'
    | 'state'
    | 'exam_date'
    | 'application_deadline';

export type SortOrder = 'asc' | 'desc';
export type TableTab = 'exam' | 'application' | 'partners';

interface TableFilterState {
    // 1. Trạng thái tìm kiếm & bộ lọc
    searchQuery: string;
    selectedState: string;
    selectedType: string;
    selectedFunding: string;
    selectedGermanLevel: string;
    selectedCourse: string;
    selectedSubject: string;
    onlyWithExamDate: boolean;
    onlyWithSampleTests: boolean;

    // 2. Trạng thái sắp xếp & Tab
    sortField: SortField;
    sortOrder: SortOrder;
    activeTableTab: TableTab;

    // 3. Actions cập nhật
    setSearchQuery: (query: string) => void;
    setSelectedState: (state: string) => void;
    setSelectedType: (type: string) => void;
    setSelectedFunding: (funding: string) => void;
    setSelectedGermanLevel: (level: string) => void;
    setSelectedCourse: (course: string) => void;
    setSelectedSubject: (subject: string) => void;
    setOnlyWithExamDate: (value: boolean) => void;
    setOnlyWithSampleTests: (value: boolean) => void;
    setActiveTableTab: (tab: TableTab) => void;
    toggleSort: (field: SortField) => void;
    resetFilters: () => void;

    // 4. Helper selectors
    getActiveFiltersCount: () => number;
}

const initialFilterValues = {
    searchQuery: '',
    selectedState: 'ALL',
    selectedType: 'ALL',
    selectedFunding: 'ALL',
    selectedGermanLevel: 'ALL',
    selectedCourse: 'ALL',
    selectedSubject: 'ALL',
    onlyWithExamDate: false,
    onlyWithSampleTests: false,
    sortField: 'name' as SortField,
    sortOrder: 'asc' as SortOrder,
    activeTableTab: 'exam' as TableTab,
};

export const useTableFilterStore = create<TableFilterState>((set, get) => ({
    ...initialFilterValues,

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedState: (selectedState) => set({ selectedState }),
    setSelectedType: (selectedType) => set({ selectedType }),
    setSelectedFunding: (selectedFunding) => set({ selectedFunding }),
    setSelectedGermanLevel: (selectedGermanLevel) => set({ selectedGermanLevel }),
    setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
    setSelectedSubject: (selectedSubject) => set({ selectedSubject }),
    setOnlyWithExamDate: (onlyWithExamDate) => set({ onlyWithExamDate }),
    setOnlyWithSampleTests: (onlyWithSampleTests) => set({ onlyWithSampleTests }),
    setActiveTableTab: (activeTableTab) => set({ activeTableTab }),

    toggleSort: (field) =>
        set((state) => {
            if (state.sortField === field) {
                return { sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' };
            }
            return { sortField: field, sortOrder: 'asc' };
        }),

    resetFilters: () => set(initialFilterValues),

    getActiveFiltersCount: () => {
        const s = get();
        return [
            s.selectedState !== 'ALL',
            s.selectedType !== 'ALL',
            s.selectedFunding !== 'ALL',
            s.selectedGermanLevel !== 'ALL',
            s.selectedCourse !== 'ALL',
            s.selectedSubject !== 'ALL',
            s.onlyWithExamDate,
            s.onlyWithSampleTests,
        ].filter(Boolean).length;
    },
}));