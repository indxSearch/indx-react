import React from 'react';
import { SearchResult } from './SearchResult';
import styles from './SearchResultsSkeleton.module.css';

export interface SearchResultsSkeletonProps {
  rows?: number;
}

const widthPairs: Array<[number, number]> = [
  [62, 38], [75, 45], [58, 33], [70, 42],
  [65, 50], [55, 35], [72, 40], [60, 30],
];

export const SearchResultsSkeleton: React.FC<SearchResultsSkeletonProps> = ({ rows = 6 }) => (
  <div className={styles.wrapper}>
    {Array.from({ length: rows }).map((_, i) => (
      <SearchResult
        key={i}
        skeleton
        skeletonDelay={i * 0.1}
        skeletonWidths={widthPairs[i % widthPairs.length]}
      />
    ))}
  </div>
);
