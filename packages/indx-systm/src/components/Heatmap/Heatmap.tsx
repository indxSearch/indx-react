import type { CSSProperties, ReactNode } from 'react';
import styles from './Heatmap.module.css';

// A grid of pixel cells toned by value: columns of `rows` cells, filled top to bottom then the
// next column, so a calendar is weeks across and weekdays down. Zero is the empty tone, the rest
// four steps up to the ink. Column labels sit beneath at the columns they name, row labels at
// the left. For days a dataset woke, searches by hour and weekday, anything that is a count per
// cell of a regular grid. `calendarCells` lays days out as weeks.

export interface HeatmapLabel {
  /** The column (or row) the label sits at, from 0. */
  at: number;
  label: ReactNode;
}

export interface HeatmapProps {
  /** One value per cell, column by column, top to bottom. null is a gap: no cell drawn. */
  values: (number | null)[];
  /** Cells down; 7 by default, a week. */
  rows?: number;
  /** The value that is the ink; the largest value by default. */
  max?: number;
  /** Labels beneath the grid, at the columns they name: months, hours. */
  columnLabels?: HeatmapLabel[];
  /** Labels left of the grid, at the rows they name: weekdays. */
  rowLabels?: HeatmapLabel[];
  /** A cell's side in pixels; 6 by default, with a 2px gap. */
  cell?: number;
  /** A cell's title on hover: the value and what it is. Nothing by default. */
  format?: (value: number, index: number) => string;
  /** A name for assistive technology: "Days woken, last six months". */
  'aria-label'?: string;
  className?: string;
}

// From the empty tone up to the ink in four steps.
const LEVELS = ['var(--lv3)', 'var(--lv4)', 'var(--lv5)', 'var(--lv8)'];

export function levelOf(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(LEVELS.length, Math.max(1, Math.ceil((value / max) * LEVELS.length)));
}

export function Heatmap({
  values,
  rows = 7,
  max,
  columnLabels,
  rowLabels,
  cell = 6,
  format,
  'aria-label': ariaLabel,
  className = '',
}: HeatmapProps) {
  const top = max ?? values.reduce<number>((a, v) => (v != null && v > a ? v : a), 0);
  const columns = Math.ceil(values.length / rows);
  const pitch = cell + 2;
  const cells = [];
  for (let i = 0; i < columns * rows; i++) {
    const v = i < values.length ? values[i] : null;
    if (v == null) {
      cells.push(<span key={i} className={styles.gap} />);
      continue;
    }
    const level = levelOf(v, top);
    cells.push(
      <span
        key={i}
        className={styles.cell}
        style={level ? { background: LEVELS[level - 1] } : undefined}
        title={format ? format(v, i) : undefined}
      />,
    );
  }
  return (
    <div
      className={`${styles.heatmap} ${rowLabels ? styles.withRows : ''} ${className}`}
      style={{ '--heatmap-rows': rows, '--heatmap-cell': `${cell}px`, '--heatmap-pitch': `${pitch}px` } as CSSProperties}
    >
      {rowLabels && (
        <div className={styles.rowLabels} aria-hidden="true">
          {rowLabels.map((l) => (
            <span key={l.at} className={styles.rowLabel} style={{ top: l.at * pitch }}>{l.label}</span>
          ))}
        </div>
      )}
      <div className={styles.grid} role="img" aria-label={ariaLabel}>
        {cells}
      </div>
      {columnLabels && (
        <div className={styles.columnLabels} aria-hidden="true">
          {columnLabels.map((l) => (
            <span key={l.at} className={styles.columnLabel} style={{ left: l.at * pitch }}>{l.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface CalendarCells {
  values: (number | null)[];
  columnLabels: HeatmapLabel[];
  rowLabels: HeatmapLabel[];
  /** The day each cell is, by index; null where the cell is a gap. */
  dates: (Date | null)[];
}

// Days from `from` to `to` (inclusive, local dates) as weeks across and weekdays down, Monday
// first, with gaps before the first day and after the last. A month label stands at the column
// holding its first day; the weekday labels are Mon, Wed and Fri.
export function calendarCells(from: Date, to: Date, valueOf: (day: Date) => number): CalendarCells {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const values: (number | null)[] = [];
  const dates: (Date | null)[] = [];
  const columnLabels: HeatmapLabel[] = [];
  const lead = (start.getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) {
    values.push(null);
    dates.push(null);
  }
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    if (day.getDate() === 1) columnLabels.push({ at: Math.floor(values.length / 7), label: MONTHS[day.getMonth()] });
    values.push(valueOf(day));
    dates.push(day);
  }
  while (values.length % 7) {
    values.push(null);
    dates.push(null);
  }
  return {
    values,
    dates,
    columnLabels,
    rowLabels: [0, 2, 4].map((at) => ({ at, label: DAYS[at] })),
  };
}
