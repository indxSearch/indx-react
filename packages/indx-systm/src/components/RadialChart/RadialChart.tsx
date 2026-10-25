import { useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import styles from './RadialChart.module.css';

// One series around a clock face: a bar a sample, from the top clockwise, its length the value,
// around a hollow centre. A thin guide a sample runs out to the rim, a dashed line at the top
// marks the start of the period. For a long series whose shape matters more than any one
// reading: a year of searches a day, the hours of a day. Hover reads a bar by its angle, as
// Chart reads by x, and says what it is in a tooltip at the bar's end.

export interface RadialChartProps {
  /** One value a sample, from the top clockwise. */
  values: number[];
  /** What each sample is, for the tooltip: a date, an hour. The index when left out. */
  labels?: string[];
  /** The diameter in pixels; 240 by default. */
  size?: number;
  /** The hollow centre's share of the radius; 0.4 by default. */
  hollow?: number;
  /** The value that reaches the rim; the largest by default. */
  max?: number;
  /** The bars' colour; the ink by default. The hovered bar is always the ink. */
  color?: string;
  /** The tooltip's text for a sample: the value and what it is. Nothing by default. */
  format?: (value: number, index: number) => string;
  /** What sits in the hollow centre: a total, a Stat. */
  centre?: ReactNode;
  /** A name for assistive technology: "Searches per day, last year". */
  'aria-label'?: string;
  className?: string;
}

export function RadialChart({
  values,
  labels,
  size = 240,
  hollow = 0.4,
  max,
  color,
  format,
  centre,
  'aria-label': ariaLabel,
  className = '',
}: RadialChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const n = values.length;
  const outer = size / 2;
  const inner = outer * Math.min(0.9, Math.max(0, hollow));
  const top = max ?? values.reduce((a, v) => (Number.isFinite(v) && v > a ? v : a), 0);
  const angleOf = (i: number) => ((-90 + (360 * i) / Math.max(1, n)) * Math.PI) / 180;
  const point = (i: number, r: number) => [outer + r * Math.cos(angleOf(i)), outer + r * Math.sin(angleOf(i))] as const;
  const lengthOf = (v: number) => (top > 0 && Number.isFinite(v) ? (Math.max(0, v) / top) * (outer - inner) : 0);
  // A bar is 2px, as the BarMeter's, where the hollow's edge has room for that; with many
  // samples it thins so the bars stay apart there, down to a hairline.
  const barWidth = Math.max(0.5, Math.min(2, ((2 * Math.PI * inner) / Math.max(1, n)) * 0.55));

  // The bar under the pointer: by its angle from the centre, clockwise from the top. Outside
  // the ring, and inside the hollow, there is none.
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (n === 0 || !format) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * size - outer;
    const y = ((e.clientY - rect.top) / rect.height) * size - outer;
    const r = Math.hypot(x, y);
    if (r < inner || r > outer) { setHover(null); return; }
    const deg = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
    setHover(Math.round((deg / 360) * n) % n);
  };

  const guides = [];
  const bars = [];
  for (let i = 0; i < n; i++) {
    const [gx1, gy1] = point(i, inner);
    const [gx2, gy2] = point(i, outer);
    guides.push(<line key={`g${i}`} className={styles.guide} x1={gx1} y1={gy1} x2={gx2} y2={gy2} />);
    const len = lengthOf(values[i]);
    if (len <= 0) continue;
    const [bx2, by2] = point(i, inner + len);
    bars.push(
      <line
        key={`b${i}`}
        className={`${styles.bar} ${hover === i ? styles.hovered : ''}`}
        x1={gx1} y1={gy1} x2={bx2} y2={by2}
      />,
    );
  }
  const [sx1, sy1] = point(0, inner);
  const [sx2, sy2] = point(0, outer);

  const tip = hover != null && format ? (() => {
    const len = lengthOf(values[hover]);
    const [tx, ty] = point(hover, inner + Math.max(len, (outer - inner) * 0.15) + 6);
    const left = tx > outer;
    return (
      <div
        className={`${styles.tooltip} ${left ? styles.tooltipLeft : ''}`}
        style={{ left: tx, top: ty }}
      >
        <span className={styles.tooltipLabel}>{labels?.[hover] ?? String(hover + 1)}</span>
        <span className={styles.tooltipValue}>{format(values[hover], hover)}</span>
      </div>
    );
  })() : null;

  return (
    <div
      className={`${styles.radial} ${className}`}
      style={{ '--radial-size': `${size}px`, color } as CSSProperties}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        className={styles.svg}
        style={{ '--radial-bar': `${barWidth}px` } as CSSProperties}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
      >
        {guides}
        <line className={styles.start} x1={sx1} y1={sy1} x2={sx2} y2={sy2} />
        {bars}
      </svg>
      {centre != null && <div className={styles.centre} style={{ width: inner * 2, height: inner * 2 }}>{centre}</div>}
      {tip}
    </div>
  );
}
