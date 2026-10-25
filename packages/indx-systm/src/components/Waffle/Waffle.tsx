import type { CSSProperties, ReactNode } from 'react';
import styles from './Waffle.module.css';

// Shares of a whole as a grid of pixel squares: each segment gets its share of the cells, filled
// column by column from the left, the first segment in the ink and the rest down the tone
// ladder, with a legend beneath. A portfolio by holding, a dataset by field type, searches by
// source. Where a pie would be, this is the pixel version.

export interface WaffleSegment {
  label: ReactNode;
  value: number;
  /** The segment's colour; without it, the tone ladder from the ink down, four steps, so a fifth segment needs one. */
  color?: string;
}

export interface WaffleProps {
  segments: WaffleSegment[];
  /** Cells across; 20 by default. */
  columns?: number;
  /** Cells down; 5 by default. */
  rows?: number;
  /** A cell's side in pixels; 4 by default, with a 2px gap. */
  cell?: number;
  /** The share as shown in the legend; defaults to a whole percent. */
  format?: (fraction: number, value: number) => ReactNode;
  /** The legend beneath the grid; on by default. */
  legend?: boolean;
  /** A name for assistive technology: "Portfolio by holding". */
  'aria-label'?: string;
  className?: string;
}

// Four steps apart enough to tell at 4px: lv6 is all but lv8 in both themes. A fifth segment
// and on keep the last step, never back to the ink, so give them a colour to tell apart.
const TONES = ['var(--lv8)', 'var(--lv5)', 'var(--lv4)', 'var(--lv3)'];

// Each segment's cells, by largest remainder, so they always sum to the grid. A segment with a
// share but a rounded count of zero still gets one cell, taken from the largest.
export function allocateCells(values: number[], total: number): number[] {
  const sum = values.reduce((a, v) => a + Math.max(0, v), 0);
  if (sum <= 0) return values.map(() => 0);
  const exact = values.map((v) => (Math.max(0, v) / sum) * total);
  const cells = exact.map(Math.floor);
  let left = total - cells.reduce((a, c) => a + c, 0);
  const order = exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    cells[i] += 1;
    left -= 1;
  }
  for (let i = 0; i < cells.length; i++) {
    if (values[i] > 0 && cells[i] === 0) {
      const largest = cells.indexOf(Math.max(...cells));
      if (cells[largest] > 1) {
        cells[largest] -= 1;
        cells[i] = 1;
      }
    }
  }
  return cells;
}

export function Waffle({
  segments,
  columns = 20,
  rows = 5,
  cell = 4,
  format,
  legend = true,
  'aria-label': ariaLabel,
  className = '',
}: WaffleProps) {
  const total = columns * rows;
  const sum = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const counts = allocateCells(segments.map((s) => s.value), total);
  const colorOf = (i: number) => segments[i].color ?? TONES[Math.min(i, TONES.length - 1)];
  const show = (s: WaffleSegment) => {
    const fraction = sum > 0 ? Math.max(0, s.value) / sum : 0;
    return format ? format(fraction, s.value) : `${Math.round(fraction * 100)} %`;
  };

  const cells = [];
  let seg = 0;
  let used = 0;
  for (let i = 0; i < total; i++) {
    while (seg < counts.length && used >= counts[seg]) {
      seg += 1;
      used = 0;
    }
    const color = seg < counts.length ? colorOf(seg) : undefined;
    used += 1;
    cells.push(<span key={i} className={styles.cell} style={color ? { background: color } : undefined} />);
  }

  return (
    <div className={`${styles.waffle} ${className}`}>
      <div
        className={styles.grid}
        role="img"
        aria-label={ariaLabel}
        style={{ '--waffle-rows': rows, '--waffle-cell': `${cell}px` } as CSSProperties}
      >
        {cells}
      </div>
      {legend && (
        <ul className={styles.legend} aria-hidden={ariaLabel ? undefined : true}>
          {segments.map((s, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.swatch} style={{ background: colorOf(i) }} />
              <span className={styles.name}>{s.label}</span>
              <span className={styles.share}>{show(s)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
