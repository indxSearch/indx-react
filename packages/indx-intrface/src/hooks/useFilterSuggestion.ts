import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext';
import { statisticsParams } from '../utils/searchOrAsk';
import type { SearchOrAskState } from './useSearchOrAsk';

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
 * The local pass: a typed word or phrase that equals a facet value, as a filter, with the text it
 * leaves. "bærum skoleoversikt" on a register whose municipality facet holds "Bærum" gives the
 * municipality filter and "skoleoversikt". Case does not matter; a value matches whole words only,
 * and a longer value wins over a shorter one it contains. No model, no delay.
 */
/** A number or a boolean typed is a condition ("over 500"), not a value to equal; the model reads those. */
function literal(key: string): boolean {
  const k = key.trim().toLowerCase();
  return k === 'true' || k === 'false' || (k !== '' && !Number.isNaN(Number(k)));
}

export function localFilters(text: string, facets: Record<string, { key: string }[]> | null | undefined): FilterSuggestionResult | null {
  if (!facets) return null;
  const candidates: { field: string; value: string }[] = [];
  for (const [field, values] of Object.entries(facets))
    for (const v of values ?? []) if (v?.key && v.key.trim().length >= 2 && !literal(v.key)) candidates.push({ field, value: v.key });
  candidates.sort((a, b) => b.value.length - a.value.length);
  let rest = ' ' + text.toLowerCase() + ' ';
  const filters: FilterSuggestion[] = [];
  for (const c of candidates) {
    const needle = ' ' + c.value.toLowerCase().trim() + ' ';
    const at = rest.indexOf(needle);
    if (at < 0) continue;
    filters.push({ field: c.field, value: c.value });
    rest = rest.slice(0, at) + ' ' + rest.slice(at + needle.length);
  }
  if (filters.length === 0) return null;
  return { filters, text: rest.replace(/[?!.,]+\s*$/, '').replace(/\s+/g, ' ').trim(), sort: null };
}

export interface UseFilterSuggestionOptions {
  /** The offer from `useSearchOrAsk`. With it, a description is turned into filters while the
   *  visitor types, the way the dataset's `filtersWhileTyping` says: facet values at once, the
   *  model for the rest, or nothing until Ask. */
  auto?: SearchOrAskState;
}

/**
 * Search or ask on a catalogue: turns a description of what to list ("private videregående i
 * bergen") into filters on the dataset's own fields (`search-or-ask/filters`), and applies them
 * to the search, where ActiveFiltersPanel shows them and the visitor can remove each. Ask for it
 * when `useSearchOrAsk` says `describes`, or hand it the offer (`auto`) and it acts on its own.
 */
export function useFilterSuggestion(options: UseFilterSuggestionOptions = {}) {
  const ctx = useSearchContext();
  const { url, team, dataset, authenticatedFetch, setQuery, toggleFilter, setRangeFilter, setSort } = ctx;
  const { auto } = options;
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
    // An open end ("over 500") closes at the dataset's own bound, not at the bound of whatever
    // the typed text happened to match.
    const bounds = { ...ctxRef.current.state.rangeBounds, ...ctxRef.current.datasetBounds };
    for (const f of result.filters) {
      if (f.value != null) toggleFilter(f.field, f.value);
      else setRangeFilter(f.field, f.min ?? bounds[f.field]?.min ?? 0, f.max ?? bounds[f.field]?.max ?? Number.MAX_SAFE_INTEGER);
    }
    if (result.sort) setSort(result.sort.field, !result.sort.descending);
    setSuggestion(null);
  }, [setQuery, toggleFilter, setRangeFilter, setSort]);

  const clear = useCallback(() => { seq.current++; setSuggestion(null); setLoading(false); }, []);

  // While typing: once per text, when the offer is strong and the dataset allows it. The facet
  // pass first (instant); in 'model' mode, on a description, the model then reads what the facets left, and
  // its filters are put on beside the facets' (one apply, since an apply resets the filters).
  // Texts already handled: the one the filters came from, and the text they left, which becomes
  // the query and must not start the pass again.
  const handled = useRef(new Set<string>());
  const [appliedText, setAppliedText] = useState<string | null>(null);
  const mode = auto?.filtersWhileTyping ?? 'off';
  // A facet value typed is that filter whether the sentence asks or describes ("hvilken skole i
  // bærum er størst" names Bærum as much as "bærum skoleoversikt" does); only the model pass,
  // which costs a call, is for descriptions.
  const wants = !!auto && auto.available && auto.offer === 'strong' && mode !== 'off';
  const describes = !!auto && auto.describes;
  const text = auto?.text ?? '';
  const textRef = useRef(text);
  textRef.current = text;
  // The facets come with the search's answer, so the pass waits for the search that is running;
  // the judge usually answers first. On a page with facets the first search of all has none yet
  // (the facet search is the debounced one), so the pass also waits for the first facets.
  const facets = ctx.state.facets;
  const searching = ctx.state.isLoading || (ctx.facetsEnabled && facets == null);
  useEffect(() => {
    if (!wants || !text || searching || handled.current.has(text)) return;
    handled.current.add(text);
    const local = localFilters(text, facets);
    if (local) { handled.current.add(local.text); apply(local); setAppliedText(text); }
    if (mode !== 'model' || !describes) return;
    const rest = local ? local.text : text;
    if (!rest) return;
    // The model's answer is for this text and the text the facets left; anything else typed in
    // the meantime makes it stale. (The facets' apply changes the query, so the effect's own
    // cleanup cannot be the signal.)
    const still = () => textRef.current === text || textRef.current === rest;
    (async () => {
      const mine = ++seq.current;
      setLoading(true);
      try {
        const res = await authenticatedFetch(
          `${url}/api/teams/${team}/datasets/${dataset}/search-or-ask/filters${statisticsParams(ctxRef.current)}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: rest }),
          });
        if (mine !== seq.current || !still()) return;
        const result = res.ok ? await res.json() as FilterSuggestionResult : null;
        if (result && result.filters.length > 0) {
          handled.current.add(result.text);
          apply({ filters: [...(local?.filters ?? []), ...result.filters], text: result.text, sort: result.sort });
          setAppliedText(text);
        }
      } catch {
        // No filter is the safe outcome.
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    })();
  }, [wants, describes, text, mode, searching, facets, apply, url, team, dataset, authenticatedFetch]);

  return { suggestion, forText, loading, suggest, apply, clear, appliedText };
}
