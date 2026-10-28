import React from 'react';
import styles from './ScoreMeter.module.css';

export interface ScoreMark {
  /** Where on the scale, 0 to 1. */
  at: number;
  /** Its name, shown on hover with its value. */
  label: string;
}

export interface ScoreMeterProps {
  /** The score, 0 to 1. */
  value: number;
  marks?: ScoreMark[];
  /** How many cells; 20 by default, a cell for each 0.05. */
  cells?: number;
  /** A cell's width in pixels; 4 by default. */
  cell?: number;
  'aria-label'?: string;
  className?: string;
}

const two = (v: number) => Math.min(1, Math.max(0, v)).toFixed(2);

/** A score from 0 to 1 as a row of small cells, the waffle's pixels in one line, lit up to the
 *  score, with a thin tick at each threshold that matters to it (its name on hover): a judge's
 *  score against the lines that decide what it does. The lit cells strengthen as the score passes
 *  the ticks: dim below them all, a step up past some, the full ink past every one. Compact, for a
 *  line of text. The Blazor ScoreMeter is its port. */
export function ScoreMeter({ value, marks = [], cells = 20, cell = 4, className = '', ...rest }: ScoreMeterProps) {
  // How far past the ticks: the lit cells dim below them all, a step up past some, the full ink past every one.
  const reach = marks.length === 0 ? '' : marks.every(m => value >= m.at) ? styles.all : marks.some(m => value >= m.at) ? styles.some : styles.none;
  return (
    <span className={`${styles.meter} ${reach} ${className}`} role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(two(value))}
          aria-label={rest['aria-label']} style={{ '--score-cell': `${cell}px` } as React.CSSProperties}>
      {Array.from({ length: cells }, (_, i) => (
        // A cell is lit when the score reaches its middle, so 0.39 lights eight of twenty.
        <span key={i} className={`${styles.cell} ${value >= (i + 0.5) / cells ? styles.lit : ''}`} />
      ))}
      {marks.map(m => (
        <span key={`${m.label}-${m.at}`} className={styles.mark} style={{ left: `${Math.min(1, Math.max(0, m.at)) * 100}%` }} title={`${m.label} ${two(m.at)}`} />
      ))}
    </span>
  );
}
