// SearchResults.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchResults.module.css';
import { SearchResultsMessage } from './SearchResultsMessage';
import type { SearchErrorInfo } from '../context/searchError';
import { useSearchContext } from '../context/SearchContext';
import type { SearchResult as SearchResultData } from '../context/SearchContext';
import { SearchResult } from './SearchResult';
import { SearchResultsSkeleton } from './SearchResultsSkeleton';
import { Ai_agent, Indx } from '@indxsearch/pixl';
import { Button } from '@indxsearch/systm';
import type { SearchOrAskState } from '../hooks/useSearchOrAsk';
import type { AskPicks } from '../hooks/useAsk';
import { useFilterSuggestion } from '../hooks/useFilterSuggestion';

export interface SearchResultsProps {
  fields?: string[];
  resultsPerPage?: number;
  /**
   * Convert string fields that hold a serialised list — JSON (`["a","b"]`) or
   * Python-style (`['a', 'b']`) — into a real string[] before they reach the
   * render prop. Off by default: any other string, including ones that merely
   * start with '[' such as "[Draft] Report", is passed through untouched.
   */
  parseArrayStrings?: boolean;
  /**
   * Renders one result. The second argument is the result itself (key, score, 1-based position)
   * and `select`, which reports that the visitor chose it: call it from the click that opens the
   * result, so the dataset's statistics get click-through and click position.
   */
  children: (item: Record<string, any>, meta: SearchResultMeta) => React.ReactNode;
  /**
   * The offer, when the page runs `useSearchOrAsk`: under the full offer to a question whose
   * answer the judge reads as not in the results (`notFound`), the list is dimmed with a line
   * above it, so the offer is what the visitor reads first. The list itself is never cut.
   */
  searchOrAsk?: SearchOrAskState;
  /** The line above a dimmed list, for a page in another language. */
  notFoundLabel?: string;
  /**
   * The records the assistant picked. Left out, the provider's: `AskPanel` puts them there, and
   * while they stand the list is those, in the assistant's order and numbered as its answer cites
   * them, each with why it was picked, in place of the search. They stand for the field's text as it
   * was when they came: once the visitor types or clears the field, the list is the search again.
   * Given, these instead; null never lists picks.
   */
  picks?: AskPicks | null;
  /** The way back to the search over the picks: "Show all 45 found" when the picks came with a
   *  search, "Show the search instead" otherwise. Left out, it does that itself: applies the
   *  picks' search when there is one, and gives the list back. */
  onShowSearch?: () => void;
  /** The heading over the picks. Default "Picked by the assistant". */
  picksLabel?: string;
  /**
   * Shows each result's score beside it. Given, it wins over the `showScore` search setting (the
   * toggle in SearchSettingsPanel); left out, that setting decides, and it is on by default.
   */
  showScore?: boolean;
}

export interface SearchResultMeta {
  result: SearchResultData;
  select: () => Promise<void>;
}

// Python-style list literal of single-quoted items: ['a', 'b c', ...] or [].
const PYTHON_LIST = /^\[\s*(?:'[^']*'(?:\s*,\s*'[^']*')*)?\s*\]$/;

/** Returns the list a string encodes, or undefined when it is not a list literal. */
export function parseArrayString(value: string): string[] | undefined {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return undefined;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(item => String(item));
  } catch {
    // not JSON — try the Python shape below
  }
  if (!PYTHON_LIST.test(trimmed)) return undefined;
  const items: string[] = [];
  const itemPattern = /'([^']*)'/g;
  let match: RegExpExecArray | null;
  while ((match = itemPattern.exec(trimmed)) !== null) items.push(match[1]);
  return items;
}

/** A document as a result row's render prop gets it: parsed, cut to `fields`, lists read. Null
 *  when it is not JSON. */
function displayOf(rawItem: unknown, fields: string[] | undefined, parseArrayStrings: boolean): Record<string, any> | null {
  let parsed: Record<string, any>;
  try {
    parsed = typeof rawItem === 'string' ? JSON.parse(rawItem) : (rawItem as Record<string, any>);
  } catch {
    return null;
  }
  let displayData: Record<string, any>;
  if (fields && fields.length > 0) {
    displayData = {};
    for (const key of fields) {
      if (key in parsed) displayData[key] = parsed[key];
    }
  } else {
    displayData = { ...parsed };
  }
  if (parseArrayStrings) {
    for (const key in displayData) {
      const val = displayData[key];
      if (typeof val === 'string') {
        const list = parseArrayString(val);
        if (list) displayData[key] = list;
      }
    }
  }
  return displayData;
}

/** The assistant's picks as the list: looked up by key, each row with why it was picked. */
const PickedResults: React.FC<{
  picks: AskPicks; fields?: string[]; parseArrayStrings: boolean; label: string; onShowSearch?: () => void;
  children: SearchResultsProps['children'];
}> = ({ picks, fields, parseArrayStrings, label, onShowSearch, children }) => {
  const { url, team, dataset, authenticatedFetch, count } = useSearchContext();
  const [docs, setDocs] = useState<Map<number, unknown> | null>(null);

  useEffect(() => {
    let gone = false;
    setDocs(null);
    const keys = picks.picks.map(p => p.documentKey);
    (async () => {
      try {
        const res = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/documents/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(keys),
        });
        const list = res.ok ? await res.json() as unknown[] : [];
        if (!gone) setDocs(new Map(keys.map((k, i) => [k, list[i]])));
      } catch {
        if (!gone) setDocs(new Map());
      }
    })();
    return () => { gone = true; };
  }, [picks, url, team, dataset, authenticatedFetch]);

  // A pick opened is a cited source opened: a select naming the answer, at the pick's number.
  const select = (documentKey: number, n: number) => async () => {
    if (!picks.askId) return;
    try {
      await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/events/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: picks.askId, documentKey, position: n, ...(count === false ? { count: false } : {}) }),
      });
    } catch {
      // Not recorded; nothing else changes.
    }
  };

  const search = picks.search;
  return (
    <>
      <div className={styles.picksHead}>
        <span className={styles.picksTitle}><Ai_agent size={14} color="currentColor" />{label}</span>
        <span className={styles.picksCount}>{picks.picks.length}</span>
        <span className={styles.picksSpacer} />
        {onShowSearch && (
          <Button variant="ghost" size="micro" onClick={onShowSearch}>
            {search ? `Show all ${search.found}${search.more ? '+' : ''} found` : 'Show the search instead'}
          </Button>
        )}
      </div>
      {docs === null ? <SearchResultsSkeleton rows={Math.max(1, picks.picks.length)} /> : (
        <div>
          {picks.picks.map(p => {
            const doc = docs.get(p.documentKey);
            const display = doc == null ? null : displayOf(doc, fields, parseArrayStrings);
            if (!display) return null;
            return (
              <SearchResult key={p.documentKey} index={p.n} showScore={false}>
                {children(display, { result: { document: doc, documentKey: p.documentKey, score: 0, position: p.n }, select: select(p.documentKey, p.n) })}
                {p.why && <div className={styles.why}><Ai_agent size={12} color="currentColor" /><span>{p.why}</span></div>}
              </SearchResult>
            );
          })}
        </div>
      )}
    </>
  );
};

export const SearchResults: React.FC<SearchResultsProps> = ({ fields, resultsPerPage, parseArrayStrings = false, searchOrAsk, notFoundLabel = 'These results may not hold what you are asking about',
  picks: picksProp, onShowSearch, picksLabel = 'Picked by the assistant', showScore, children }) => {
  const {
    state: { results, resultsSuppressed, searchSettings, countedTotal, query, error, errorInfo },
    isFetchingInitial,
    authError,
    authErrorInfo,
    retry,
    allowEmptySearch,
    fetchMoreResults,
    selectResult,
    searchText,
    searchAsTyped,
    picks: providerPicks,
    showPicks,
  } = useSearchContext();
  const { apply } = useFilterSuggestion();
  const picks = picksProp === undefined ? providerPicks : picksProp;
  const showSearch = onShowSearch ?? (() => {
    if (picks?.search) apply(picks.search);
    showPicks?.(null);
  });

  // The picks stand for the text in the field when they came; typing or Clear brings the search back.
  const picksFor = useRef<{ picks: AskPicks; query: string } | null>(null);
  if (picks && picksFor.current?.picks !== picks) picksFor.current = { picks, query };
  const picksShown = !!picks && picksFor.current?.query === query;

  const pageSize = resultsPerPage ?? 30;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const previousResultsLength = useRef<number>(0);
  const previousQuery = useRef<string>('');

  useEffect(() => {
    const queryChanged = query !== previousQuery.current;
    if (!results || (results.length < previousResultsLength.current) || queryChanged) {
      setVisibleCount(pageSize);
    }
    previousResultsLength.current = results?.length ?? 0;
    previousQuery.current = query;
  }, [results, pageSize, query]);

  const shown = results ?? [];
  // Under the full offer, the judge reads what is asked about as not in this list.
  const dimmed = !!searchOrAsk?.notFound;
  // The list searched something other than what was typed (the provider's `searchTextOf`): say so,
  // with the way back.
  const rewritten = searchText != null && searchText.trim() !== query.trim() ? searchText : null;
  // The server may hold more than came back when the batch filled what was asked for and the
  // counted set does not end inside it. Until Nov 2026 Load more showed only for hits already
  // fetched beyond the page, so with the provider's 10 and this page's 30 the first batch never
  // offered it.
  const serverMayHaveMore = !!results
    && results.length >= searchSettings.maxNumberOfRecordsToReturn
    && (countedTotal === undefined || countedTotal > results.length);
  const canLoadMore = !!results && (shown.length > visibleCount || serverMayHaveMore);

  const handleLoadMore = () => {
    const newVisibleCount = visibleCount + pageSize;
    setVisibleCount(newVisibleCount);
    if (results && newVisibleCount >= results.length && serverMayHaveMore) {
      fetchMoreResults(results.length + pageSize);
    }
  };

  if (picks && picksShown && !isFetchingInitial && !authError) {
    return <PickedResults picks={picks} fields={fields} parseArrayStrings={parseArrayStrings} label={picksLabel}
                          onShowSearch={showSearch}>{children}</PickedResults>;
  }

  if (isFetchingInitial) {
    return allowEmptySearch
      ? <SearchResultsSkeleton rows={pageSize} />
      : <div className={styles.placeholder}><Indx size={200} color="var(--lv5)"/></div>;
  }

  // Initialisation failures (bad token, unknown dataset) and failed searches are
  // stored in context rather than thrown, so show them here instead of the idle logo.
  // A context built by hand may carry only the message; it shows as an unknown failure.
  const errorMessage = authError ?? error;
  if (errorMessage) {
    const info: SearchErrorInfo = (authError ? authErrorInfo : errorInfo) ??
      { kind: 'unknown', message: errorMessage, technical: errorMessage, retryable: false };
    return <SearchResultsMessage error={info} onRetry={retry} />;
  }

  if (resultsSuppressed || results === null) {
    return <div className={styles.placeholder}><Indx size={200} color="var(--lv5)"/></div>;
  }

  // Nothing to show: SearchInput's No results chip says so.
  if (shown.length === 0) {
    return null;
  }

  return (
    <>
      {rewritten && (
        <div className={styles.searchedFor} aria-live="polite">
          <span>Searching for <strong>{rewritten}</strong></span>
          {searchAsTyped && <Button variant="ghost" size="micro" onClick={searchAsTyped}>Search for your exact words</Button>}
        </div>
      )}
      {dimmed && <p className={styles.notFound} aria-live="polite">{notFoundLabel}</p>}
      <div className={dimmed ? styles.dimmed : undefined}>
        {shown.slice(0, visibleCount).map((result, idx) => {
          const score = result.score;
          const displayData = displayOf(result.document, fields, parseArrayStrings);
          if (!displayData) {
            return (
              <div key={idx} className={styles.invalid}>
                <p>Invalid JSON</p>
              </div>
            );
          }

          return (
            <SearchResult
              key={idx}
              index={idx}
              score={score}
              showScore={showScore ?? searchSettings.showScore}
            >
              {children(displayData, { result, select: () => selectResult?.(result) ?? Promise.resolve() })}
            </SearchResult>
          );
        })}
      </div>
      {canLoadMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Button variant="secondary" size="micro" onClick={handleLoadMore}>
            {(() => {
              if (query.trim() === '') return 'Load more';
              if (countedTotal !== undefined && countedTotal > 0) {
                return `Load results ${visibleCount + 1}-${Math.min(visibleCount + pageSize, results.length, countedTotal)} of ${countedTotal}`;
              }
              return 'Load more';
            })()}
          </Button>
        </div>
      )}
    </>
  );
};
