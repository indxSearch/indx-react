import { useCallback, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext';
import { statisticsParams } from '../utils/searchOrAsk';

/** One filter a description asked for: a value (text, or "true"/"false") or a number range. */
export interface FilterSuggestion {
  field: string;
  value?: string | null;
  min?: number | null;
  max?: number | null;
}

export interface FilterSuggestionResult {
  filters: FilterSuggestion[];
  /** What no filter covers, to search for; empty when the filters cover it all. */
  text: string;
  /** An order the description asked for, on a Sortable field. */
  sort?: { field: string; descending: boolean } | null;
}

/**
 * Search or ask on a catalogue: turns a description of what to list ("private videregående i
 * bergen") into filters on the dataset's own fields (`search-or-ask/filters`), and applies them
 * to the search, where ActiveFiltersPanel shows them and the visitor can remove each. Ask for it
 * when `useSearchOrAsk` says `describes`.
 */
export function useFilterSuggestion() {
  const ctx = useSearchContext();
  const { url, team, dataset, authenticatedFetch, setQuery, toggleFilter, setRangeFilter, setSort } = ctx;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const [suggestion, setSuggestion] = useState<FilterSuggestionResult | null>(null);
  const [forText, setForText] = useState('');
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  /** Asks for the filters a text describes. Keeps only the newest answer. */
  const suggest = useCallback(async (text: string) => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await authenticatedFetch(
        `${url}/api/teams/${team}/datasets/${dataset}/search-or-ask/filters${statisticsParams(ctxRef.current)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      if (mine !== seq.current) return;
      const result = res.ok ? await res.json() as FilterSuggestionResult : null;
      setSuggestion(result && result.filters.length > 0 ? result : null);
      setForText(text);
    } catch {
      if (mine === seq.current) setSuggestion(null);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [url, team, dataset, authenticatedFetch]);

  /** Puts the filters on the search, and leaves what no filter covers as the search text. */
  const apply = useCallback((result: FilterSuggestionResult) => {
    // setQuery clears the filters, so the text goes first and the filters after it.
    setQuery(result.text);
    const bounds = ctxRef.current.state.rangeBounds;
    for (const f of result.filters) {
      if (f.value != null) toggleFilter(f.field, f.value);
      else setRangeFilter(f.field, f.min ?? bounds[f.field]?.min ?? 0, f.max ?? bounds[f.field]?.max ?? Number.MAX_SAFE_INTEGER);
    }
    if (result.sort) setSort(result.sort.field, !result.sort.descending);
    setSuggestion(null);
  }, [setQuery, toggleFilter, setRangeFilter, setSort]);

  const clear = useCallback(() => { seq.current++; setSuggestion(null); setLoading(false); }, []);

  return { suggestion, forText, loading, suggest, apply, clear };
}
