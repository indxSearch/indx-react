import { useState, useCallback, useEffect, useRef } from 'react';
import type { SearchState } from './SearchContext';
import type { IndxAuthResult } from './useIndxAuth';
import { buildFilterProxy } from './buildFilterProxy';

function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

export interface UseSearchExecutionOptions {
  state: SearchState;
  setState: React.Dispatch<React.SetStateAction<SearchState>>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  auth: IndxAuthResult;
  url: string;
  team: string;
  dataset: string;
  allowEmptySearch: boolean;
  facetsEnabled: boolean;
  enableDebugLogs: boolean;
  filtersChangedByUser: React.MutableRefObject<boolean>;
  shouldFetchMore: React.MutableRefObject<boolean>;
}

export type UseSearchExecutionResult = void;

export function useSearchExecution({
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
  filtersChangedByUser,
  shouldFetchMore,
}: UseSearchExecutionOptions): UseSearchExecutionResult {
  const latestRequestId = useRef(0);
  const performSearchRef = useRef<((options: { enableFacets: boolean }) => Promise<void>) | undefined>(undefined);
  const hasInitialized = useRef(false);

  const [fixedFacetStats, setFixedFacetStats] = useState<Record<string, { min: number; max: number }>>({});
  const [lastQueryText, setLastQueryText] = useState<string>('');
  const [lastRangeBoundsQuery, setLastRangeBoundsQuery] = useState<string>('');

  // Seed all auth-derived state once initialisation completes
  useEffect(() => {
    if (!auth.isFetchingInitial) {
      setState(prev => ({
        ...prev,
        facetStats: auth.initialFacetStats,
        rangeBounds: auth.initialFacetStats,
        totalDocumentCount: auth.totalDocumentCount,
        filterableFields: auth.filterableFields,
        facetableFields: auth.facetableFields,
        sortableFields: auth.sortableFields,
      }));
    }
  }, [
    auth.isFetchingInitial,
    auth.initialFacetStats,
    auth.totalDocumentCount,
    auth.filterableFields,
    auth.facetableFields,
    auth.sortableFields,
    setState,
  ]);

  // Extract primitives from state to keep the dep arrays stable
  const settingsMaxResults = state.searchSettings.maxNumberOfRecordsToReturn;
  const settingsEnableCoverage = state.searchSettings.enableCoverage;
  const settingsRemoveDuplicates = state.searchSettings.removeDuplicates;
  const settingsCoverageDepth = state.searchSettings.coverageDepth;
  const settingsMinimumScore = state.searchSettings.minimumScore;
  const settingsCoverageSetup = state.searchSettings.coverageSetup;
  const sortBy = state.sortBy;
  const sortAscending = state.sortAscending;

  const performSearch = useCallback(
    async ({ enableFacets }: { enableFacets: boolean }) => {
      if (!auth.token) return;
      const currentRequestId = ++latestRequestId.current;
      setState(prev => ({ ...prev, isLoading: true }));

      // Backend rejects empty text + enableFacets=false
      const isEmptyQuery = state.query.trim() === '';
      if (isEmptyQuery) {
        if (!allowEmptySearch) return; // should not reach here, but guard defensively
        enableFacets = true;           // backend requires facets=true for empty searches
      }

      try {
        // 1) Build combined filter proxy
        const filterProxy = await buildFilterProxy(state.filters, state.rangeFilters, url, team, dataset, authenticatedFetch, state.valueMatch);

        // 2) Determine if we should fetch results
        const shouldFetchResults = allowEmptySearch || state.query.trim() !== '';
        const searchBody = {
          text: state.query,
          maxNumberOfRecordsToReturn: shouldFetchResults ? settingsMaxResults : 0,
          enableFacets,
          ...(filterProxy ? { filter: filterProxy } : {}),
          ...(sortBy ? { sortBy } : {}),
          ...(sortAscending !== undefined ? { sortAscending } : {}),
          enableCoverage: settingsEnableCoverage,
          removeDuplicates: settingsRemoveDuplicates,
          coverageDepth: settingsCoverageDepth,
          coverageSetup: settingsCoverageSetup,
        };

        if (enableDebugLogs) {
          console.log('[performSearch] request body:', JSON.stringify(searchBody, null, 2));
        }

        // 3) Execute the search
        const searchResponse = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody),
        });
        if (!searchResponse.ok) {
          throw new Error(`Search failed: HTTP ${searchResponse.status}`);
        }
        const searchData = await searchResponse.json();
        const truncationIndex = searchData.truncationIndex ?? -1;

        // 4) Fetch actual documents if needed
        const records = searchData.records || [];
        const keys = records.map((record: any) => record.documentKey);
        const scores = records.map((record: any) => record.score);

        let combinedResults: any[] = [];
        if (shouldFetchResults && keys.length > 0) {
          const jsonResponse = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/documents/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(keys),
          });
          if (!jsonResponse.ok) {
            throw new Error(`Document lookup failed: HTTP ${jsonResponse.status}`);
          }
          const documentsData = await jsonResponse.json();
          combinedResults = documentsData.map((doc: any, idx: number) => ({
            document: doc,
            documentKey: keys[idx],
            score: scores[idx],
          }));
        }

        // 5) Build live facetStats (min/max under current filters)
        let newFacetStats: Record<string, { min: number; max: number }> = {};
        if (enableFacets && searchData.facets) {
          for (const [field, values] of Object.entries(searchData.facets)) {
            if (Array.isArray(values) && values.length > 0) {
              const numericValues = (values as any[])
                .map(v => Number(v.key))
                .filter((v: number) => !isNaN(v));
              if (numericValues.length > 0) {
                newFacetStats[field] = {
                  min: Math.min(...numericValues),
                  max: Math.max(...numericValues),
                };
              }
            }
          }
        }

        // 6) Discard if a newer request has arrived. This must come before any
        //    state write below: a slow, superseded response must not leave the
        //    range rails or the per-query bounds layer at its own (older) query.
        if (currentRequestId !== latestRequestId.current) return;

        // 7) Determine if query changed
        const queryChanged = state.query !== lastQueryText;
        const rangeBoundsNeedsUpdate = state.query !== lastRangeBoundsQuery;

        // 8) Merge facetStats: global bounds layer + live narrowed stats on top
        let mergedFacetStats = state.facetStats ?? {};
        if (queryChanged) {
          mergedFacetStats = { ...auth.initialFacetStats, ...newFacetStats };
          setFixedFacetStats(mergedFacetStats);
          setLastQueryText(state.query);
        } else {
          mergedFacetStats = { ...fixedFacetStats, ...newFacetStats };
        }

        // 9) Update rangeBounds when query changes
        if (rangeBoundsNeedsUpdate && enableFacets) {
          const updatedBounds = { ...state.rangeBounds };
          for (const [field, stats] of Object.entries(newFacetStats)) {
            updatedBounds[field] = stats;
          }
          setState(prev => ({ ...prev, rangeBounds: updatedBounds }));
          setLastRangeBoundsQuery(state.query);
        }

        // 10) Prepare displayFacets (fallback to initial keys for non-coverage fields)
        let displayFacets: any = searchData.facets;
        if (enableFacets && (!displayFacets || Object.keys(displayFacets).length === 0)) {
          displayFacets = {};
          for (const [field, fieldKeys] of Object.entries(auth.initialFacetKeys)) {
            displayFacets[field] = (fieldKeys as string[]).map(key => ({ key, value: null }));
          }
        }

        // 11) Final state update

        const filteredResults = combinedResults.filter(result => {
          const query = state.query.trim();
          if (query === '' || query.length === 1) return true;
          return result.score >= settingsMinimumScore;
        });

        setState(prev => ({
          ...prev,
          results: filteredResults,
          error: undefined,
          resultsSuppressed: !shouldFetchResults,
          ...(enableFacets ? { facets: displayFacets, facetStats: mergedFacetStats } : {}),
          isLoading: false,
          truncationIndex,
        }));
      } catch (error) {
        console.error('[Search] ❌ Search failed:', error);

        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error('[Search] ❌ Network error - cannot reach INDX server');
          console.error('[Search] 💡 Check if server is running at:', url);
        } else if (error instanceof Error) {
          if (error.message.includes('401')) {
            console.error('[Search] ❌ Authentication failed');
            console.error('[Search] 💡 Your token may have expired. Create or refresh it on the IndxCloudApi website.');
          } else if (error.message.includes('404')) {
            console.error('[Search] ❌ Dataset not found');
            console.error('[Search] 💡 Check that dataset "' + dataset + '" exists');
          } else {
            console.error('[Search] 💡 Error:', error.message);
          }
        }

        if (currentRequestId !== latestRequestId.current) return;
        setState(prev => ({
          ...prev,
          results: null,
          isLoading: false,
          resultsSuppressed: false,
          error: error instanceof Error ? error.message : 'Search failed',
        }));
      }
    },
    [
      state.query,
      state.filters,
      state.valueMatch,
      state.rangeFilters,
      state.facetStats,
      sortBy,
      sortAscending,
      settingsMaxResults,
      settingsEnableCoverage,
      settingsRemoveDuplicates,
      settingsCoverageDepth,
      settingsCoverageSetup,
      settingsMinimumScore,
      authenticatedFetch,
      auth.initialFacetStats,
      auth.initialFacetKeys,
      auth.token,
      fixedFacetStats,
      lastQueryText,
      lastRangeBoundsQuery,
      state.rangeBounds,
      url,
      team,
      dataset,
      allowEmptySearch,
      enableDebugLogs,
      setState,
    ]
  );

  // Keep ref in sync with latest performSearch
  useEffect(() => {
    performSearchRef.current = performSearch;
  }, [performSearch]);

  // Debounced facet search — recreated only when delay changes
  const searchWithFacetsDebounced = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    searchWithFacetsDebounced.current?.cancel();
    searchWithFacetsDebounced.current = debounce(() => {
      if (enableDebugLogs) console.log('Debounced searchWithFacets fired');
      performSearchRef.current?.({ enableFacets: true });
    }, state.facetDebounceDelayMillis ?? 500);
    return () => { searchWithFacetsDebounced.current?.cancel(); };
  }, [state.facetDebounceDelayMillis]); // enableDebugLogs intentionally omitted

  // Trigger: initial search after auth completes
  useEffect(() => {
    if (!auth.isFetchingInitial && auth.token && !hasInitialized.current) {
      if (allowEmptySearch) {
        performSearchRef.current?.({ enableFacets: facetsEnabled });
      }
      hasInitialized.current = true;
    }
  }, [auth.isFetchingInitial, auth.token, allowEmptySearch, facetsEnabled]);

  // Trigger: query changes
  useEffect(() => {
    if (!auth.token) return;
    if (!hasInitialized.current) return;

    const trimmedQuery = state.query.trim();
    const isEmptySearch = trimmedQuery === '' && allowEmptySearch;
    const shouldSkipEmptySearch = trimmedQuery === '' && !allowEmptySearch;

    if (shouldSkipEmptySearch) {
      if (!state.resultsSuppressed) {
        setState(prev => ({ ...prev, resultsSuppressed: true }));
      }
      return;
    }

    if (isEmptySearch) {
      searchWithFacetsDebounced.current?.cancel();
      performSearchRef.current?.({ enableFacets: facetsEnabled });
    } else if (facetsEnabled) {
      if (enableDebugLogs) console.log('Search fired');
      performSearchRef.current?.({ enableFacets: false });
      searchWithFacetsDebounced.current?.();
    } else {
      performSearchRef.current?.({ enableFacets: false });
    }

    return () => { searchWithFacetsDebounced.current?.cancel(); };
  }, [state.query, allowEmptySearch, facetsEnabled]);

  // Trigger: user-initiated filter changes
  useEffect(() => {
    const wasChangedByUser = filtersChangedByUser.current;
    filtersChangedByUser.current = false;

    if (!hasInitialized.current || !auth.token) return;
    if (!wasChangedByUser) return;

    const trimmedQuery = state.query.trim();
    const shouldSkipSearch = !allowEmptySearch && trimmedQuery === '';
    if (!shouldSkipSearch) {
      performSearchRef.current?.({ enableFacets: facetsEnabled });
    }
  }, [state.filters, state.rangeFilters]);

  // Trigger: sort changes
  useEffect(() => {
    if (!hasInitialized.current || !auth.token) return;
    const trimmedQuery = state.query.trim();
    const shouldSkipSearch = !allowEmptySearch && trimmedQuery === '';
    if (!shouldSkipSearch) {
      performSearchRef.current?.({ enableFacets: facetsEnabled });
    }
  }, [sortBy, sortAscending]);

  // Trigger: search-affecting settings changed (SearchSettingsPanel or
  // setSearchSettings), or fetchMore raised maxNumberOfRecordsToReturn.
  // Display-only settings (showScore, placeholderText) are deliberately not deps.
  const isFirstSettingsRun = useRef(true);
  const settingsQueryRef = useRef(state.query);
  useEffect(() => {
    if (isFirstSettingsRun.current) {
      isFirstSettingsRun.current = false;
      return;
    }
    // setQuery resets maxNumberOfRecordsToReturn in the same commit that changes
    // the query; the query trigger owns that search, so don't fire a second one.
    if (settingsQueryRef.current !== state.query) return;
    if (!hasInitialized.current || !auth.token) return;

    if (shouldFetchMore.current) {
      shouldFetchMore.current = false;
      performSearchRef.current?.({ enableFacets: false });
      return;
    }

    const trimmedQuery = state.query.trim();
    const shouldSkipSearch = !allowEmptySearch && trimmedQuery === '';
    if (!shouldSkipSearch) {
      performSearchRef.current?.({ enableFacets: facetsEnabled });
    }
  }, [
    settingsMaxResults,
    settingsEnableCoverage,
    settingsRemoveDuplicates,
    settingsCoverageDepth,
    settingsCoverageSetup,
    settingsMinimumScore,
  ]);
  // Declared after the settings trigger so that, within one commit, the trigger
  // still sees the previous query and can tell a query-driven reset apart.
  useEffect(() => {
    settingsQueryRef.current = state.query;
  }, [state.query]);

}

