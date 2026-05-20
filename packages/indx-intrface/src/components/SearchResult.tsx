import React from 'react';
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
            <div
              className={styles.skeletonBarLg}
              style={{ width: `${skeletonWidths[0]}%`, animationDelay: `${skeletonDelay}s` }}
            />
            <div
              className={styles.skeletonBarSm}
              style={{ width: `${skeletonWidths[1]}%`, animationDelay: `${skeletonDelay + 0.05}s` }}
            />
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
