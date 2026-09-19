import React from 'react';
import styles from './Truncate.module.css';

export interface TruncateProps {
  children: React.ReactNode;
  /**
   * Which end gives way when the text does not fit. `end` (default) is the usual trailing
   * ellipsis. `start` cuts the beginning and keeps the end, for text whose last part identifies
   * it: a nested field name, a file path, a URL.
   */
  side?: 'start' | 'end';
  /** Tooltip with the full text. Pass it whenever the children are not a plain string. */
  title?: string;
  className?: string;
}

/**
 * One line of text that ellipsizes instead of wrapping or overflowing. It shrinks inside a flex
 * row or a grid column (min-width: 0), which a bare span with text-overflow does not.
 */
export function Truncate({ children, side = 'end', title, className = '' }: TruncateProps) {
  const tip = title ?? (typeof children === 'string' ? children : undefined);
  return (
    <span className={`${styles.truncate} ${side === 'start' ? styles.start : ''} ${className}`} title={tip}>
      {/* The start variant lays the line out right to left so that the overflow, and the
          ellipsis, land on the left. The bdi puts the text itself back in its own direction,
          which also keeps a trailing dot or slash where it was written. */}
      {side === 'start' ? <bdi>{children}</bdi> : children}
    </span>
  );
}
