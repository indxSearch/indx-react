import React from 'react';
import { FilterPanelBase } from '@indxsearch/systm';
import styles from './FilterPanelSkeleton.module.css';

const rowWidths = [65, 80, 55, 72, 60, 75, 50, 68];

export interface FilterPanelSkeletonProps {
  title?: string;
  rows?: number;
  variant?: 'list' | 'slider';
  collapsible?: boolean;
  startCollapsed?: boolean;
}

export const FilterPanelSkeleton: React.FC<FilterPanelSkeletonProps> = ({
  title,
  rows = 5,
  variant = 'list',
  collapsible = true,
  startCollapsed = false,
}) => (
  <FilterPanelBase title={title} collapsible={collapsible} collapsed={startCollapsed}>
    {variant === 'slider' ? (
      <div className={styles.sliderArea}>
        <div className={styles.sliderTrack} />
        <div className={styles.inputRow}>
          <div className={styles.inputBar} style={{ animationDelay: '0.1s' }} />
          <div className={styles.inputBar} style={{ animationDelay: '0.15s' }} />
        </div>
      </div>
    ) : (
      <div className={styles.listRows}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{
              width: `${rowWidths[i % rowWidths.length]}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    )}
  </FilterPanelBase>
);
