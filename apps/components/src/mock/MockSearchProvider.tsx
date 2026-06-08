
import React, { useState, ReactNode } from 'react';
import { SearchContext } from '@indxsearch/intrface';
import type { SearchContextType } from '@indxsearch/intrface';

// Numeric facets for range filter / histogram demos
const numericFacets = {
  hp: [
    { key: '10', value: 2 }, { key: '30', value: 8 }, { key: '45', value: 25 },
    { key: '60', value: 40 }, { key: '75', value: 35 }, { key: '90', value: 28 },
    { key: '105', value: 18 }, { key: '120', value: 12 }, { key: '150', value: 6 },
    { key: '180', value: 3 }, { key: '250', value: 1 },
  ],
  attack: [
    { key: '5', value: 3 }, { key: '20', value: 10 }, { key: '40', value: 22 },
    { key: '55', value: 38 }, { key: '70', value: 42 }, { key: '85', value: 30 },
    { key: '100', value: 20 }, { key: '120', value: 14 }, { key: '150', value: 8 },
    { key: '190', value: 2 },
  ],
  speed: [
    { key: '5', value: 4 }, { key: '25', value: 12 }, { key: '45', value: 30 },
    { key: '65', value: 45 }, { key: '80', value: 38 }, { key: '100', value: 25 },
    { key: '115', value: 15 }, { key: '130', value: 8 }, { key: '150', value: 4 },
    { key: '200', value: 1 },
  ],
};

const categoryFacets = {
  type: [
    { key: 'water', value: 45 }, { key: 'fire', value: 32 }, { key: 'grass', value: 28 },
    { key: 'electric', value: 15 }, { key: 'psychic', value: 12 }, { key: 'dragon', value: 8 },
  ],
  rarity: [
    { key: 'common', value: 85 }, { key: 'uncommon', value: 42 },
    { key: 'rare', value: 18 }, { key: 'legendary', value: 5 },
  ],
  is_legendary: [
    { key: 'true', value: 20 }, { key: 'false', value: 130 },
  ],
};

const rangeBounds = {
  hp:     { min: 10, max: 250 },
  attack: { min: 5,  max: 190 },
  defense:{ min: 5,  max: 230 },
  speed:  { min: 5,  max: 200 },
};

const noop = () => {};
const noopFetch = () => Promise.resolve(new Response());

export function MockSearchProvider({ children, isFetchingInitial = false }: { children: ReactNode; isFetchingInitial?: boolean }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [rangeFilters, setRangeFiltersState] = useState<Record<string, { min: number; max: number }>>({});
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortAscending, setSortAscending] = useState(true);

  const toggleFilter = (field: string, value: string) => {
    setFilters(prev => {
      const cur = prev[field] ?? [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      if (next.length === 0) { const { [field]: _, ...rest } = prev; return rest; }
      return { ...prev, [field]: next };
    });
  };

  const setRangeFilter = (field: string, min: number, max: number) => {
    setRangeFiltersState(prev => ({ ...prev, [field]: { min, max } }));
  };

  const resetRangeFilter = (field: string) => {
    setRangeFiltersState(prev => { const { [field]: _, ...rest } = prev; return rest; });
  };

  const resetFilters = () => { setFilters({}); setRangeFiltersState({}); };

  const value: SearchContextType = {
    state: {
      query,
      results: null,
      isLoading: false,
      filters,
      rangeFilters,
      rangeBounds,
      facets: { ...categoryFacets, ...numericFacets },
      facetStats: {
        hp:     { min: 10, max: 250 },
        attack: { min: 5,  max: 190 },
        defense:{ min: 5,  max: 230 },
        speed:  { min: 5,  max: 200 },
      },
      facetDebounceDelayMillis: 300,
      filterableFields: ['type', 'rarity', 'is_legendary', 'hp', 'attack', 'defense', 'speed'],
      facetableFields:  ['type', 'rarity', 'is_legendary', 'hp', 'attack', 'defense', 'speed'],
      sortableFields:   ['name', 'hp', 'attack', 'defense', 'speed'],
      sortBy: sortBy ?? undefined,
      sortAscending,
      searchSettings: {
        maxNumberOfRecordsToReturn: 30,
        coverageDepth: 0,
        enableCoverage: false,
        removeDuplicates: false,
        coverageSetup: {
          coverWholeQuery: false, coverWholeWords: false, coverFuzzyWords: false,
          coverJoinedWords: false, coverPrefixSuffix: false, truncate: false,
          includePatternMatches: false, minWordSize: 0, levenshteinMaxWordSize: 0,
          truncateWordHitLimit: 0, truncateWordHitTolerance: 0, truncationScore: 0,
        },
        minimumScore: 0,
        showScore: false,
        placeholderText: 'Search…',
      },
    },
    isFetchingInitial,
    allowEmptySearch: true,
    url: '',
    team: 'mock',
    dataset: 'mock',
    authenticatedFetch: noopFetch,
    setQuery,
    toggleFilter,
    setRangeFilter,
    resetRangeFilter,
    resetFilters,
    resetSingleFilter: (field, value) => {
      if (value !== undefined) toggleFilter(field, value);
      else resetRangeFilter(field);
    },
    setSort: (field, ascending) => { setSortBy(field); setSortAscending(ascending); },
    setSearchSettings: noop,
    fetchMoreResults: noop,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}
