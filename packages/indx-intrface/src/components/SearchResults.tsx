// SearchResults.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchResults.module.css';
import { useSearchContext } from '../context/SearchContext';
import { SearchResult } from './SearchResult';
import { SearchResultsSkeleton } from './SearchResultsSkeleton';
import { Indx } from '@indxsearch/pixl';
import { Button } from '@indxsearch/systm';

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
  children: (item: Record<string, any>) => React.ReactNode;
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

export const SearchResults: React.FC<SearchResultsProps> = ({ fields, resultsPerPage, parseArrayStrings = false, children }) => {
  const {
    state: { results, resultsSuppressed, searchSettings, truncationIndex, query, error },
    isFetchingInitial,
    authError,
    allowEmptySearch,
    fetchMoreResults,
  } = useSearchContext();

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

  const canLoadMore = results && results.length > visibleCount;

  const handleLoadMore = () => {
    const newVisibleCount = visibleCount + pageSize;
    setVisibleCount(newVisibleCount);
    if (results && newVisibleCount >= results.length) {
      const mightHaveMore = !truncationIndex || truncationIndex === -1 || truncationIndex > results.length;
      if (mightHaveMore) {
        fetchMoreResults(results.length + pageSize);
      }
    }
  };

  if (isFetchingInitial) {
    return allowEmptySearch
      ? <SearchResultsSkeleton rows={pageSize} />
      : <div className={styles.placeholder}><Indx size={200} color="var(--lv5)"/></div>;
  }

  // Initialisation failures (bad token, unknown dataset) and failed searches are
  // stored in context rather than thrown, so show them here instead of the idle logo.
  const errorMessage = authError ?? error;
  if (errorMessage) {
    return (
      <div className={styles.invalid} role="alert">
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (resultsSuppressed || results === null) {
    return <div className={styles.placeholder}><Indx size={200} color="var(--lv5)"/></div>;
  }

  if (results.length === 0) {
    return <div className={styles.invalid}><p>No results found.</p></div>;
  }

  return (
    <>
      <div>
        {(results ?? []).slice(0, visibleCount).map((result, idx) => {
          const rawItem = result.document;
          const score = result.score;
          let parsed: Record<string, any>;
          try {
            parsed = typeof rawItem === 'string' ? JSON.parse(rawItem) : rawItem;
          } catch {
            return (
              <div key={idx} className={styles.invalid}>
                <p>Invalid JSON</p>
              </div>
            );
          }

          let displayData: Record<string, any>;
          if (fields && fields.length > 0) {
            displayData = {};
            for (const key of fields) {
              if (key in parsed) {
                displayData[key] = parsed[key];
              }
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

          return (
            <SearchResult
              key={idx}
              index={idx}
              score={score}
              showScore={searchSettings.showScore}
            >
              {children(displayData)}
            </SearchResult>
          );
        })}
      </div>
      {canLoadMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Button variant="secondary" size="micro" onClick={handleLoadMore}>
            {(() => {
              if (query.trim() === '') return 'Load more';
              if (truncationIndex !== -1 && truncationIndex !== undefined && truncationIndex > 0) {
                return `Load results ${visibleCount + 1}-${Math.min(visibleCount + pageSize, results.length, truncationIndex)} of ${truncationIndex}`;
              }
              return 'Load more';
            })()}
          </Button>
        </div>
      )}
    </>
  );
};
