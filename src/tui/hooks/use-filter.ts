import { useState, useCallback, useMemo } from "react";
import type { MonitorRow } from "./use-monitors.js";

export type FilterMode = "normal" | "search" | "filter-menu";

export interface UseFilterResult {
  filteredMonitors: MonitorRow[];
  searchQuery: string;
  statusFilter: number | null;
  mode: FilterMode;
  setMode: (mode: FilterMode) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: number | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilter(monitors: MonitorRow[]): UseFilterResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [mode, setMode] = useState<FilterMode>("normal");

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter(null);
    setMode("normal");
  }, []);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== null;

  const filteredMonitors = useMemo(() => {
    let result = monitors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.url.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== null) {
      result = result.filter((m) => m.status === statusFilter);
    }

    return result;
  }, [monitors, searchQuery, statusFilter]);

  return {
    filteredMonitors,
    searchQuery,
    statusFilter,
    mode,
    setMode,
    setSearchQuery,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
  };
}
