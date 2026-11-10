import { useQuery } from '@tanstack/react-query';
import { Studienkolleg } from '../types/studienkolleg';

// Fetch toàn bộ danh sách Studienkolleg từ API route của Next.js
async function fetchStudienkollegs(): Promise<Studienkolleg[]> {
    const response = await fetch('/api/studienkollegs');
    if (!response.ok) {
        throw new Error('FAILED_TO_FETCH_STUDIENKOLLEGS');
    }
    const data = await response.json();
    return data.data ?? data;
}

// Fetch chi tiết 1 trường theo slug
async function fetchStudienkollegDetail(slug: string): Promise<Studienkolleg> {
    const response = await fetch(`/api/studienkollegs/${slug}`);
    if (!response.ok) {
        throw new Error('FAILED_TO_FETCH_STUDIENKOLLEG_DETAIL');
    }
    const data = await response.json();
    return data.data ?? data;
}

/**
 * Hook lấy toàn bộ danh sách Studienkollegs kèm caching của TanStack Query
 * @param initialData Dữ liệu fetch từ Server Component (SSR) nếu có
 */
export function useStudienkollegsQuery(initialData?: Studienkolleg[]) {
    return useQuery({
        queryKey: ['studienkollegs'],
        queryFn: fetchStudienkollegs,
        initialData,
    });
}

/**
 * Hook lấy chi tiết một trường Studienkolleg theo slug kèm caching
 * @param slug Định danh của trường
 * @param initialData Dữ liệu fetch từ Server Component nếu có
 */
export function useStudienkollegDetailQuery(slug: string, initialData?: Studienkolleg) {
    return useQuery({
        queryKey: ['studienkollegs', slug],
        queryFn: () => fetchStudienkollegDetail(slug),
        initialData,
        enabled: !!slug,
    });
}