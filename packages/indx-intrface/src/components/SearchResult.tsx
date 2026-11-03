import React from 'react';
import { Skeleton } from '@indxsearch/systm';
import styles from './SearchResult.module.css';

export interface SearchResultProps {
  skeleton?: boolean;
  index?: number;
  score?: number;
  showScore?: boolean;
  children?: React.ReactNode;
  /** Animation delay for staggered skeleton rows (seconds) */
  skeletonDelay?: number;
  /** Width percentages [titleWidth, subtitleWidth] for skeleton bars */
  skeletonWidths?: [number, number];
}

export const SearchResult: React.FC<SearchResultProps> = ({
  skeleton = false,
  index,
  score,
  showScore = false,
  children,
  skeletonDelay = 0,
  skeletonWidths = [62, 38],
}) => {
  return (
    <div className={styles.row}>
      {index !== undefined && (
        <div className={styles.indexNumber}>{index}</div>
      )}
      <div className={styles.content}>
        {skeleton ? (
          <div className={styles.skeletonBars}>
            <Skeleton level={3} height={12} width={`${skeletonWidths[0]}%`} delay={skeletonDelay} appear={false} />
            <Skeleton level={3} height={8} width={`${skeletonWidths[1]}%`} delay={skeletonDelay + 0.05} appear={false} />
          </div>
        ) : (
          children
        )}
      </div>
      {showScore && score !== undefined && (
        <div className={styles.scoreNumber}>{score}</div>
      )}
    </div>
  );
};
