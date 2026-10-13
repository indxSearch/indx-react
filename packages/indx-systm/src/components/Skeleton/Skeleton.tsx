import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  /** Any CSS length; a number is px. Defaults to the full width. */
  width?: number | string;
  /** Any CSS length; a number is px. Defaults to 10px, a line of small text. */
  height?: number | string;
  /** The tone: 2 on the page (lv0, lv1), 3 on a Base surface (lv2), so it stays darker than what it sits on. */
  level?: 2 | 3;
  /** Seconds to hold this one back, to stagger a column of skeletons. */
  delay?: number;
  /**
   * Fade in after a short wait, so an answer that comes quickly never flashes a skeleton. Default
   * true. Turn it off when a parent fades the whole group in instead.
   */
  appear?: boolean;
  className?: string;
  style?: CSSProperties;
}

const size = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

/**
 * A placeholder for content that is on its way: a bar or block that pulses slowly. The one place
 * systm moves besides Spinner, because the visitor is waiting. With reduced motion it holds a
 * steady tone. It is decorative (aria-hidden); mark the region that is loading with aria-busy.
 */
export function Skeleton({ width = '100%', height = 10, level = 2, delay = 0, appear = true, className = '', style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${level === 3 ? styles.level3 : ''} ${appear ? styles.appear : ''} ${className}`}
      style={{ width: size(width), height: size(height), '--skeleton-delay': `${delay}s`, ...style } as CSSProperties}
    />
  );
}
