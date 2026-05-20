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
  children: (item: Record<string, any>) => React.ReactNode;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ fields, resultsPerPage, children }) => {
  const {
    state: { results, resultsSuppressed, searchSettings, truncationIndex, query },
    isFetchingInitial,
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

          // Strip array-like strings into real string[]
          for (const key in displayData) {
            const val = displayData[key];
            if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
              const inner = val.replace(/^\[|\]$/g, '');
              displayData[key] = inner
                .split(',')
                .map(s => s.trim().replace(/^'|'$/g, ''))
                .filter(s => s.length > 0);
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
