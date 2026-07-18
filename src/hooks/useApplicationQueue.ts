import { useCallback, useEffect, useState } from 'react';
import { HiringPipelineService } from '../services';
import type { PipelineApplication } from '../services';

export interface QueueFilters {
  search: string;
  status: string;
  jobId: string;
  dateFrom: string;
  dateTo: string;
  tagIds: string[];
  sortBy: 'createdAt' | 'updatedAt' | 'status' | 'candidateName';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_QUEUE_FILTERS: QueueFilters = {
  search: '',
  status: '',
  jobId: '',
  dateFrom: '',
  dateTo: '',
  tagIds: [],
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const LIMIT = 20;

/**
 * Shared search/filter/sort/debounce/pagination logic for the candidate
 * queue. Previously duplicated between HiringPipelinePanel and
 * CandidatesQueuePanel; both now consume this instead of maintaining their
 * own copies of the same state machine.
 */
export function useApplicationQueue(initialFilters: Partial<QueueFilters> = {}) {
  const [filters, setFiltersState] = useState<QueueFilters>({ ...DEFAULT_QUEUE_FILTERS, ...initialFilters });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [page, setPage] = useState(1);

  const [applications, setApplications] = useState<PipelineApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce free-text search only; other filters apply immediately since
  // they're discrete selections (dropdowns, date pickers, tag chips), not
  // per-keystroke input.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setFiltersState(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const setFilters = useCallback((updates: Partial<QueueFilters>) => {
    setPage(1);
    setFiltersState(prev => ({ ...prev, ...updates }));
  }, []);

  const applyFilterSet = useCallback((next: Partial<QueueFilters>) => {
    setPage(1);
    setFiltersState(prev => ({ ...DEFAULT_QUEUE_FILTERS, ...prev, ...next }));
    if (next.search !== undefined) setSearchInput(next.search);
  }, []);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await HiringPipelineService.getQueue({
        search: filters.search || undefined,
        status: filters.status || undefined,
        jobId: filters.jobId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page,
        limit: LIMIT
      });
      setApplications(result.applications);
      setTotal(result.total);
      return result.applications;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the candidate queue.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return {
    applications,
    setApplications,
    total,
    page,
    setPage,
    totalPages,
    limit: LIMIT,
    filters,
    setFilters,
    applyFilterSet,
    searchInput,
    setSearchInput,
    isLoading,
    error,
    refetch: fetchQueue
  };
}
