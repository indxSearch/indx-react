import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { CoverageSetup } from '@indxsearch/indx-types';
import { useIndxAuth } from './useIndxAuth';
import { useSearchExecution } from './useSearchExecution';
import type { ValueMatch, NumericRange } from './buildFilterProxy';

export type { ValueMatch, NumericRange };

// Internal type with all CoverageSetup properties required (SearchContext always provides defaults)
export type RequiredCoverageSetup = Required<CoverageSetup>;

export interface SearchSettings {
  maxNumberOfRecordsToReturn: number;
  coverageDepth: number;
  enableCoverage: boolean;
  removeDuplicates: boolean;
  coverageSetup: RequiredCoverageSetup;
  minimumScore: number;
  showScore: boolean;
  placeholderText: string;
}

export interface SearchResult {
  document: any; // The actual document
  documentKey: number; // The document key
  score: number; // The search score
}

export interface SearchState {
  query: string; // The current search query text entered by the user
  results: SearchResult[] | null; // The array of search results, or null if no search has been performed yet
  isLoading: boolean; // Whether a search is currently in progress
  resultsSuppressed?: boolean; // Whether results should be hidden (e.g. when query is empty and allowEmptySearch is false)
  facetDebounceDelayMillis?: number; // The delay in milliseconds before performing a faceted search after typing stops
  error?: string; // Any error message that occurred during the last search
  facets?: any | null; // The current facet counts and values for each facetable field
  filterableFields: string[]; // List of fields that can be used for filtering
  facetableFields: string[]; // List of fields that can be used for faceting
  sortableFields: string[]; // List of fields that can be used for sorting results
  filters: Record<string, string[]>; // Current active filters, mapping field names to arrays of selected values
  valueMatch: Record<string, ValueMatch>; // Per field: 'all' (AND the selected values, default) or 'any' (OR them). Registered by ValueFilterPanel's `match` prop
  rangeFilters: Record<string, { min: number; max: number }>; // Current active range filters, mapping field names to min/max values
  bucketFilters: Record<string, NumericRange[]>; // Selected buckets per field (BucketFilterPanel). Disjoint ranges, ORed within the field
  fieldsSeeded: boolean; // True once the field lists and initial bounds from initialisation have been copied into this state. isFetchingInitial stays true until then, so no panel validates a field against an empty list for the one render in between
  filterRevision: number; // Bumped in the same state update as every user-initiated filter change; the search trigger keys on it, so a programmatic change (isUserAction false) never searches and a user change always searches with its own state
  facetStats?: Record<string, { min: number; max: number }>; // Current facet statistics (min/max values) for numeric fields, updated with each search
  rangeBounds: Record<string, { min: number; max: number }>; // Range bounds for numeric fields, updated when query or auth data changes
  sortBy?: string; // The field currently being used to sort results
  sortAscending?: boolean; // Whether the current sort is ascending (true) or descending (false)
  searchSettings: SearchSettings;
  truncationIndex?: number;
  totalDocumentCount?: number; // Total number of documents in the dataset
}

export interface SearchContextType {
  state: SearchState; // The current search state containing all search-related data
  isFetchingInitial: boolean; // Whether the initial data (fields, facets) is still being loaded
  authError?: string; // Set when initialization failed (bad token, unknown dataset, unreachable server)
  allowEmptySearch: boolean; // Whether empty searches are allowed
  url: string;
  team: string;
  dataset: string;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  setQuery: (query: string) => void; // Updates the search query text
  toggleFilter: (field: string, value: string, exclusive?: boolean) => void; // Toggles a value on a field. `exclusive` makes it single-select: the value replaces the selection, and clicking the selected value clears it
  setValueMatch: (field: string, match: ValueMatch) => void; // How several selected values on one field combine: 'all' (AND) or 'any' (OR)
  setRangeFilter: (field: string, min: number, max: number) => void; // Sets min/max values for a range filter
  resetFilters: () => void; // Clears all active filters and range filters
  resetSingleFilter: (field: string, value: string, isUserAction?: boolean) => void; // Removes a specific value from a value filter
  resetRangeFilter: (field: string, isUserAction?: boolean) => void; // Removes a range filter for a field
  toggleBucketFilter: (field: string, range: NumericRange, exclusive?: boolean) => void; // Selects or deselects one bucket on a field. `exclusive` makes it single-select
  resetBucketFilter: (field: string, range?: NumericRange, isUserAction?: boolean) => void; // Removes one bucket, or every bucket on the field when no range is given
  setSort: (field: string | null, ascending: boolean) => void; // Sets the sort field and direction
  setDebounceDelay?: (ms: number) => void; // Optional: Updates the debounce delay for faceted searches
  setSearchSettings: (settings: Partial<SearchSettings>) => void;
  fetchMoreResults: (newMax: number) => void; // Fetches more results by increasing maxNumberOfRecordsToReturn
}

// Create the search context
export const SearchContext = createContext<SearchContextType | undefined>(undefined);

// SearchProvider component that manages the search state and provides the search context
export const SearchProvider: React.FC<{
  children: React.ReactNode;
  url: string;
  team: string;
  dataset: string;
  allowEmptySearch?: boolean;
  maxResults?: number;
  facetDebounceDelayMillis?: number;
  enableFacets?: boolean;
  coverageDepth?: number;
  removeDuplicates?: boolean;
  enableCoverage?: boolean;
  initialCoverageSetup?: Partial<CoverageSetup>;
  enableDebugLogs?: boolean;
  preAuthenticatedToken?: string; // Bearer token used for all requests
}> = ({
  children,
  url,
  team,
  dataset,
  allowEmptySearch = false,
  maxResults = 10,
  facetDebounceDelayMillis = 500, // debounce faceted searches only
  enableFacets = true,
  coverageDepth = 500,
  removeDuplicates = true,
  enableCoverage = true,
  initialCoverageSetup = {},
  enableDebugLogs = false,
  preAuthenticatedToken,
}) => {
  const shouldFetchMore = useRef(false);
  // The page size the user wants. Starts at the maxResults prop and follows
  // setSearchSettings({ maxNumberOfRecordsToReturn }); a new query resets the
  // "load more" expansion back to this value rather than to the prop.
  const userMaxResultsRef = useRef(maxResults);

  const [state, setState] = useState<SearchState>({
    query: '',
    results: null,
    isLoading: false,
    resultsSuppressed: !allowEmptySearch,
    facetDebounceDelayMillis,
    filterableFields: [],
    facetableFields: [],
    sortableFields: [],
    filters: {},
    valueMatch: {},
    rangeFilters: {},
    bucketFilters: {},
    filterRevision: 0,
    fieldsSeeded: false,
    facetStats: {},
    rangeBounds: {},
    searchSettings: {
      maxNumberOfRecordsToReturn: maxResults,
      coverageDepth,
      enableCoverage,
      removeDuplicates,
      minimumScore: 0,
      showScore: true,
      placeholderText: 'Type to search',
      coverageSetup: {
        // Default values matching Swagger specification
        coverWholeQuery: true,
        coverWholeWords: true,
        coverFuzzyWords: true,
        coverJoinedWords: true,
        coverPrefixSuffix: true,
        truncate: true,
        includePatternMatches: true,
        minWordSize: 2,
        levenshteinMaxWordSize: 20,
        truncateWordHitLimit: 1,
        truncateWordHitTolerance: 0,
        truncationScore: 65024,
        ...initialCoverageSetup, // Allow prop-based override
      },
    },
  });

  useEffect(() => {
    if (enableDebugLogs) {
      console.log("SearchContext mounted on client");
    }
  }, [enableDebugLogs]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      facetDebounceDelayMillis,
    }));
  }, [facetDebounceDelayMillis]);

  const [facetsEnabled] = useState(enableFacets);

  const auth = useIndxAuth({ url, team, dataset, preAuthenticatedToken, enableDebugLogs });

  // Authenticated fetch wrapper
  const authenticatedFetch = useCallback((url: string, options: RequestInit = {}) => {
    if (!auth.token) {
      throw new Error('No authentication token available');
    }
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${auth.token}`,
      },
    });
  }, [auth.token]);

  useSearchExecution({
    state,
    setState,
    authenticatedFetch,
    auth,
    url,
    team,
    dataset,
    allowEmptySearch,
    facetsEnabled,
    enableDebugLogs,
    shouldFetchMore,
  });

  // Function to update the search query text
  const setQuery = useCallback((query: string) => {
    setState(prev => {
      // Preserve empty filter references to avoid triggering filter effect unnecessarily
      const hasFilters = Object.keys(prev.filters).length > 0;
      const hasRangeFilters = Object.keys(prev.rangeFilters).length > 0;
      const hasBucketFilters = Object.keys(prev.bucketFilters).length > 0;

      return {
        ...prev,
        query,
        filters: hasFilters ? {} : prev.filters,
        rangeFilters: hasRangeFilters ? {} : prev.rangeFilters,
        bucketFilters: hasBucketFilters ? {} : prev.bucketFilters,
        searchSettings: {
          ...prev.searchSettings,
          maxNumberOfRecordsToReturn: userMaxResultsRef.current,
        },
      };
    });
  }, []);

  // Function to update the debounce delay for faceted searches
  const setDebounceDelay = useCallback((ms: number) => {
    setState(prev => ({
      ...prev,
      facetDebounceDelayMillis: ms,
    }));
  }, []);

  const setSearchSettings = useCallback((settings: Partial<SearchSettings>) => {
    if (typeof settings.maxNumberOfRecordsToReturn === 'number') {
      userMaxResultsRef.current = settings.maxNumberOfRecordsToReturn;
    }
    setState(prev => {
      const newSettings = { ...prev.searchSettings, ...settings };

      // Preserve coverageSetup reference if not explicitly provided
      if (!settings.coverageSetup) {
        newSettings.coverageSetup = prev.searchSettings.coverageSetup;
      } else {
        // Merge with existing when provided
        newSettings.coverageSetup = {
          ...prev.searchSettings.coverageSetup,
          ...settings.coverageSetup,
        };
      }

      return {
        ...prev,
        searchSettings: newSettings,
      };
    });
  }, []);

  const fetchMoreResults = useCallback((newMax: number) => {
    shouldFetchMore.current = true;
    setState(prev => ({
      ...prev,
      searchSettings: {
        ...prev.searchSettings,
        maxNumberOfRecordsToReturn: newMax,
      },
    }));
  }, []);

  // Function to toggle a value filter on/off for a given field
  const toggleFilter = useCallback((field: string, value: string, exclusive: boolean = false) => {
    setState(prev => {
      const updatedFilters = { ...prev.filters };
      const currentValues = updatedFilters[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : exclusive ? [value] : [...currentValues, value];

      if (newValues.length) {
        updatedFilters[field] = newValues;
      } else {
        delete updatedFilters[field];
      }

      return {
        ...prev,
        filters: updatedFilters,
        filterRevision: prev.filterRevision + 1,
      };
    });
  }, []);

  const setValueMatch = useCallback((field: string, match: ValueMatch) => {
    setState(prev => {
      if (prev.valueMatch[field] === match) return prev;
      return { ...prev, valueMatch: { ...prev.valueMatch, [field]: match } };
    });
  }, []);

  // Function to set min/max values for a range filter
  const setRangeFilter = useCallback((field: string, min: number, max: number) => {
    setState(prev => ({
      ...prev,
      rangeFilters: {
        ...prev.rangeFilters,
        [field]: { min, max },
      },
      filterRevision: prev.filterRevision + 1,
    }));
  }, []);

  // Function to clear all active filters and range filters
  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      rangeFilters: {},
      bucketFilters: {},
      filterRevision: prev.filterRevision + 1,
    }));
  }, []);

  const resetSingleFilter = useCallback((field: string, value: string, isUserAction: boolean = true) => {
    setState(prev => {
      const updatedFilters = { ...prev.filters };
      const newValues = (updatedFilters[field] || []).filter(v => v !== value);
      if (newValues.length > 0) {
        updatedFilters[field] = newValues;
      } else {
        delete updatedFilters[field];
      }
      return { ...prev, filters: updatedFilters, filterRevision: prev.filterRevision + (isUserAction ? 1 : 0) };
    });
  }, []);

  const resetRangeFilter = useCallback((field: string, isUserAction: boolean = true) => {
    setState(prev => {
      if (!(field in prev.rangeFilters)) return prev; // nothing to remove, nothing to search for
      const updatedRangeFilters = { ...prev.rangeFilters };
      delete updatedRangeFilters[field];
      return { ...prev, rangeFilters: updatedRangeFilters, filterRevision: prev.filterRevision + (isUserAction ? 1 : 0) };
    });
  }, []);

  const sameRange = (a: NumericRange, b: NumericRange) => a.min === b.min && a.max === b.max;

  const toggleBucketFilter = useCallback((field: string, range: NumericRange, exclusive: boolean = false) => {
    setState(prev => {
      const current = prev.bucketFilters[field] ?? [];
      const next = current.some(r => sameRange(r, range))
        ? current.filter(r => !sameRange(r, range))
        : exclusive ? [range] : [...current, range];
      const bucketFilters = { ...prev.bucketFilters };
      if (next.length > 0) bucketFilters[field] = next;
      else delete bucketFilters[field];
      return { ...prev, bucketFilters, filterRevision: prev.filterRevision + 1 };
    });
  }, []);

  const resetBucketFilter = useCallback((field: string, range?: NumericRange, isUserAction: boolean = true) => {
    setState(prev => {
      const bucketFilters = { ...prev.bucketFilters };
      const next = range ? (bucketFilters[field] ?? []).filter(r => !sameRange(r, range)) : [];
      if (next.length > 0) bucketFilters[field] = next;
      else delete bucketFilters[field];
      return { ...prev, bucketFilters, filterRevision: prev.filterRevision + (isUserAction ? 1 : 0) };
    });
  }, []);

  // Function to set the sort field and direction
  const setSort = useCallback((field: string | null, ascending: boolean) => {
    setState(prev => ({
      ...prev,
      sortBy: field || undefined,
      sortAscending: field ? ascending : undefined,
    }));
  }, []);

  return (
    <SearchContext.Provider
      value={{
        state,
        isFetchingInitial: auth.isFetchingInitial || !state.fieldsSeeded,
        authError: auth.authError ?? undefined,
        allowEmptySearch,
        url,
        team,
        dataset,
        authenticatedFetch,
        setQuery,
        toggleFilter,
        setValueMatch,
        setRangeFilter,
        resetFilters,
        resetSingleFilter,
        resetRangeFilter,
        toggleBucketFilter,
        resetBucketFilter,
        setSort,
        setDebounceDelay,
        setSearchSettings,
        fetchMoreResults
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};