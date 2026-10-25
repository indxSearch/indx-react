import type { CSSProperties, ReactNode } from 'react';
import styles from './BarMeter.module.css';

// A quantity against its ceiling, as bars: the filled ones in the ink, the rest dim. Two shapes.
// 'bar' is a row with a label above, the value at the left below and the ceiling at the right.
// 'ring' is the same bars around a circle, from the top clockwise, the value in the middle, the
// ceiling under it from 96px, and the label beneath; a 48px ring holds a short value and fits a
// Stat. Where ProgressBar is a percentage on its way to done,
// BarMeter is a level that goes up and down: CPU pressure, memory in use, a quota. The row's bars
// are drawn by a repeating gradient, so their number follows the width; the ring's are SVG lines,
// as many as keep the same 4px pitch at the middle of the band. With segments the row is shares
// of a whole instead of a level: each segment its share of the bars in a tone of its own, the
// name and share above it, a hairline between; a colour stays on the bars, the share is ink.

export type BarMeterShape = 'bar' | 'ring';

/** A level from which the meter changes colour: warning from 70 %, the signal red from 85 %. */
export interface BarMeterZone {
  /** Where the zone starts, as a share of max, 0 to 1. */
  from: number;
  color: string;
}

/** The colour of the zone the level has reached, or none below the first. */
const zoneColor = (zones: BarMeterZone[] | undefined, fraction: number) =>
  zones?.filter((z) => fraction >= z.from).sort((a, b) => b.from - a.from)[0]?.color;

/** The zone that starts at this bar of `count`, if one does: the bar is its tick. */
const zoneStartingAt = (zones: BarMeterZone[] | undefined, i: number, count: number) =>
  zones?.find((z) => z.from > 0 && Math.round(z.from * count) === i);

export interface BarMeterSegment {
  label: ReactNode;
  value: number;
  /** The segment's colour; without it, the tone ladder from the ink down, four steps. */
  color?: string;
}

// The same four steps as Waffle, apart enough to tell at 2px; a fifth segment and on keep the
// last, never back to the ink.
const SEGMENT_TONES = ['var(--lv8)', 'var(--lv5)', 'var(--lv4)', 'var(--lv3)'];
const toneOf = (i: number) => SEGMENT_TONES[Math.min(i, SEGMENT_TONES.length - 1)];
// A head needs room: a segment narrower than this gets none, so heads never pile up. The last
// keeps its head whatever its width, since it sits against the right edge with the edge to itself.
const MIN_HEAD_SHARE = 0.08;

export interface BarMeterProps {
  /** What is measured: "CPU pressure", "Memory". A ring inside a Stat leaves it to the Stat. */
  label?: ReactNode;
  /** The level; with segments, left out: the segments are the whole. */
  value?: number;
  max?: number;
  /**
   * The row as shares of a whole: each segment its share of the bars in its own tone, with its
   * name and share above it and a hairline between. Holders by kind, documents by type. The
   * row shape only; value, max and the foot are not used.
   */
  segments?: BarMeterSegment[];
  /**
   * Where the segments' names and shares go: 'heads' above each segment (a segment under 8 %
   * of the row gets none, the last one apart), or 'legend', a list under the bars, for many or
   * narrow segments.
   */
  labels?: 'heads' | 'legend';
  /** The value as shown at the left; defaults to the number itself. */
  format?: (value: number) => ReactNode;
  /** The ceiling as shown at the right; defaults to "of" and the formatted max. */
  maxLabel?: ReactNode;
  /** The filled bars' colour, for a level that has become a problem: the signal red past a threshold. Overrides the zones. */
  color?: string;
  /**
   * Levels from which the filled bars change colour: cool blue when idle, teal when fine, a
   * warning from 70 %, the signal red from 85 %. One bar in each zone's colour marks where it
   * starts, so the thresholds can be seen before they are reached.
   */
  zones?: BarMeterZone[];
  /** A row of bars (default) or a ring of them. */
  shape?: BarMeterShape;
  /** The ring's diameter in pixels; 72 by default, 48 the smallest that holds a value. From 96 the ceiling joins the value in the middle. The row ignores it. */
  size?: number;
  className?: string;
}

const RING_PITCH = 4;
// The band is 14px like the row, 6px below 72px so the hole still holds a short value ("84 %"
// at 48px); the ceiling joins the value in the hole from 96px, where there is room for a second
// line.
const RING_CEILING_FROM = 96;
const ringBand = (size: number) => (size < 72 ? 6 : 14);

export function BarMeter({
  label,
  value = 0,
  max = 100,
  segments,
  labels = 'heads',
  format,
  maxLabel,
  color,
  zones,
  shape = 'bar',
  size = 72,
  className = '',
}: BarMeterProps) {
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const fillColor = color ?? zoneColor(zones, fraction);
  const show = (n: number) => (format ? format(n) : n.toLocaleString());
  const ceiling = maxLabel ?? <>of {show(max)}</>;

  if (segments && shape !== 'ring') {
    const sum = segments.reduce((a, g) => a + Math.max(0, g.value), 0);
    const showShare = (g: BarMeterSegment) => (format ? format(g.value) : `${Math.round((sum > 0 ? g.value / sum : 0) * 100)} %`);
    let start = 0;
    const parts = segments.map((g, i) => {
      const from = start;
      const share = sum > 0 ? Math.max(0, g.value) / sum : 0;
      start += share;
      return { g, i, from, to: i === segments.length - 1 ? 1 : start, share, color: g.color ?? toneOf(i) };
    });
    return (
      <div className={`${styles.meter} ${styles.segmented} ${className}`} role="img" aria-label={typeof label === 'string' ? label : undefined}>
        {label != null && <span className={styles.label}>{label}</span>}
        <div className={`${styles.shares} ${labels === 'legend' ? styles.sharesLegend : ''}`}>
          {labels === 'heads' && parts.map(({ g, i, from, to, share }) => (share >= MIN_HEAD_SHARE || i === parts.length - 1) && (
            <div
              key={i}
              className={`${styles.head} ${i === parts.length - 1 ? styles.headLast : ''}`}
              style={{ '--seg-from': `${from * 100}%`, '--seg-to': `${to * 100}%` } as CSSProperties}
            >
              <span className={styles.headName}>{g.label}</span>
              <span className={styles.headShare}>{showShare(g)}</span>
            </div>
          ))}
          <div className={styles.bars} aria-hidden="true">
            {parts.map(({ i, from, to, color }) => (
              <div
                key={i}
                className={`${styles.fill} ${styles.segment}`}
                style={{ '--seg-from': `${from * 100}%`, '--seg-to': `${to * 100}%`, color } as CSSProperties}
              />
            ))}
          </div>
          {parts.slice(1).map(({ i, from }) => (
            <span key={`d${i}`} className={styles.divider} style={{ '--seg-from': `${from * 100}%` } as CSSProperties} />
          ))}
        </div>
        {labels === 'legend' && (
          <ul className={styles.legend}>
            {parts.map(({ g, i, color }) => (
              <li key={i} className={styles.legendItem}>
                <span className={styles.swatch} style={{ background: color }} />
                <span className={styles.legendName}>{g.label}</span>
                <span className={styles.legendShare}>{showShare(g)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (shape === 'ring') {
    return (
      <div
        className={`${styles.meter} ${styles.ring} ${className}`}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{ '--meter-size': `${size}px`, color: fillColor } as CSSProperties}
      >
        <div className={styles.dial}>
          <RingBars fraction={fraction} size={size} zones={zones} />
          <div className={styles.centre} aria-hidden="true">
            <span className={styles.value}>{show(value)}</span>
            {size >= RING_CEILING_FROM && <span className={styles.max}>{ceiling}</span>}
          </div>
        </div>
        {label != null && <span className={styles.label}>{label}</span>}
      </div>
    );
  }

  return (
    <div
      className={`${styles.meter} ${className}`}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {label != null && <span className={styles.label}>{label}</span>}
      <div className={styles.bars} aria-hidden="true">
        {zones?.filter((z) => z.from > 0).map((z, i) => (
          <div
            key={i}
            className={`${styles.fill} ${styles.zoneMark}`}
            style={{ '--zone-from': `${z.from * 100}%`, color: z.color } as CSSProperties}
          />
        ))}
        <div
          className={styles.fill}
          style={{ '--meter-fill': `${fraction * 100}%`, color: fillColor } as CSSProperties}
        />
      </div>
      <div className={styles.foot} aria-hidden="true">
        <span className={styles.value}>{show(value)}</span>
        <span className={styles.max}>{ceiling}</span>
      </div>
    </div>
  );
}

// The ring's bars: 2px radial lines from the inner to the outer radius, as many as give a 4px
// pitch along the middle of the band, the first at the top and the rest clockwise. The filled
// ones are the first round(fraction * count), in currentColor; the rest dim. The bar where a
// zone starts is its tick, in the zone's colour, lit or not.
function RingBars({ fraction, size, zones }: { fraction: number; size: number; zones?: BarMeterZone[] }) {
  const outer = size / 2;
  const inner = Math.max(0, outer - ringBand(size));
  const middle = (outer + inner) / 2;
  const count = Math.max(4, Math.round((2 * Math.PI * middle) / RING_PITCH));
  const filled = Math.round(fraction * count);
  const lines = [];
  for (let i = 0; i < count; i++) {
    const angle = (-90 + (360 * i) / count) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const mark = zoneStartingAt(zones, i, count);
    lines.push(
      <line
        key={i}
        className={mark ? styles.zoneBar : i < filled ? styles.lit : styles.dim}
        style={mark ? { stroke: mark.color } : undefined}
        x1={outer + inner * cos}
        y1={outer + inner * sin}
        x2={outer + outer * cos}
        y2={outer + outer * sin}
      />,
    );
  }
  return (
    <svg className={styles.svg} viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      {lines}
    </svg>
  );
}
