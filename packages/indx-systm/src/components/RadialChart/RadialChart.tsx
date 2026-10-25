import { useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import styles from './RadialChart.module.css';

// Bars around a clock face, from the top clockwise, around a hollow centre, in three shapes.
// One series: a bar a sample, its length the value, with a hairline guide a sample out to the
// rim and a dashed line at the top for the start of the period; a year of days, the hours of
// a day. Several series: the sample's slot shared between them, each in its colour, with a
// legend; searches and asks by hour. Groups, the rose: a wedge per group, its radius the
// value, over a dim wedge the full radius, the name and the value upright in it; a handful of
// kinds compared. Hover reads a bar or a wedge by its angle, as Chart reads by x.

export interface RadialSeries {
  label: string;
  values: number[];
  /** The bars' colour; the first series is the ink, the rest need one. */
  color?: string;
}

export interface RadialGroup {
  label: string;
  value: number;
  /** The sector's colour; the ink by default. */
  color?: string;
}

export interface RadialChartProps {
  /** One series: a value a sample, from the top clockwise. */
  values?: number[];
  /** Several series over the same samples, each in its colour; the first is the ink. */
  series?: RadialSeries[];
  /** What each sample is, for the tooltip: a date, an hour. The index when left out. */
  labels?: string[];
  /** The rose: a wedge a group, its radius the group's value, the name and value in it. */
  groups?: RadialGroup[];
  /** The gap between the rose's wedges, in pixels, the same at the hollow and the rim; 4 by default. */
  gap?: number;
  /** The rose's corner radius in pixels; 8 by default, less on a small face. */
  rounding?: number;
  /** The diameter in pixels; 240 by default. */
  size?: number;
  /** The hollow centre's share of the radius; 0.4 by default. */
  hollow?: number;
  /** Bars hung from the rim, growing inward over the ticks, as a dial; the value sits in the centre. */
  inverse?: boolean;
  /** The value that reaches the rim; the largest by default. */
  max?: number;
  /** The bars' colour for one series; the ink by default. The hovered bar is always the ink. */
  color?: string;
  /** The tooltip's text for a value: the value and what it is. Nothing by default. */
  format?: (value: number, index: number) => string;
  /** What sits in the hollow centre: a total, a Stat. */
  centre?: ReactNode;
  /** The legend under several series; on by default. */
  showLegend?: boolean;
  /** A name for assistive technology: "Searches per day, last year". */
  'aria-label'?: string;
  className?: string;
}

const DEFAULT_COLOR = 'var(--lv6)';

export function RadialChart({
  values,
  series,
  labels,
  groups,
  gap = 4,
  rounding = 8,
  size = 240,
  hollow = 0.4,
  inverse = false,
  max,
  color,
  format,
  centre,
  showLegend = true,
  'aria-label': ariaLabel,
  className = '',
}: RadialChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const outer = size / 2;
  const inner = outer * Math.min(0.9, Math.max(0, hollow));
  const span = outer - inner;

  // The shape: the rose is a wedge a group, one slot each; otherwise the series over the
  // samples' slots, a lane a series inside the slot.
  const grouped = !!groups?.length;
  const all: RadialSeries[] = grouped
    ? [{ label: '', values: groups!.map((g) => g.value), color }]
    : series?.length ? series : [{ label: '', values: values ?? [], color }];
  const slots = Math.max(...all.map((s) => s.values.length), 0);
  const valueAt = (s: number, slot: number) => all[s].values[slot];
  const top = max ?? all.reduce((a, s) => s.values.reduce((b, v) => (Number.isFinite(v) && v > b ? v : b), a), 0);
  const step = (2 * Math.PI) / Math.max(1, slots);
  const lanes = all.length;
  const angleOf = (slot: number, lane = 0) => -Math.PI / 2 + step * (slot + (lanes > 1 ? (lane + 0.5) / lanes - 0.5 : 0));
  const point = (slot: number, r: number, lane = 0) => [outer + r * Math.cos(angleOf(slot, lane)), outer + r * Math.sin(angleOf(slot, lane))] as const;
  const lengthOf = (v: number) => (top > 0 && Number.isFinite(v) ? (Math.max(0, v) / top) * span : 0);
  // Where a bar starts and where it ends: from the hollow out, or from the rim in.
  const barFrom = inverse ? outer : inner;
  const barTo = (len: number) => (inverse ? outer - len : inner + len);
  // A bar is 2px, as the BarMeter's, where the hollow's edge has room for that; with many it
  // thins so they stay apart there, down to a hairline.
  const barWidth = Math.max(0.5, Math.min(2, ((2 * Math.PI * inner) / Math.max(1, slots * lanes)) * 0.55));
  const colorOf = (s: number) => all[s].color ?? DEFAULT_COLOR;

  // A wedge of the rose, from the hollow out to r. Its edges stand off the slot's boundaries by a
  // fixed number of pixels, so the gap is as wide at the rim as at the hollow, and the corners
  // are rounded by drawing the path inset by the corner radius and stroking it that wide in its
  // own colour with round joins. The path is the inset one; the stroke brings it out to size.
  const corner = Math.min(rounding, span * 0.12);
  const inset = gap / 2 + corner;
  const wedge = (slot: number, r: number) => {
    const ri = inner + inset;
    const ro = Math.max(ri + 0.5, r - inset);
    const a = angleOf(slot);
    const hi = Math.max(0.01, step / 2 - inset / ri);
    const ho = Math.max(0.01, step / 2 - inset / ro);
    const p = (rad: number, ang: number) => `${(outer + rad * Math.cos(ang)).toFixed(2)} ${(outer + rad * Math.sin(ang)).toFixed(2)}`;
    const large = 2 * ho > Math.PI ? 1 : 0;
    return `M ${p(ri, a - hi)} L ${p(ro, a - ho)} A ${ro.toFixed(2)} ${ro.toFixed(2)} 0 ${large} 1 ${p(ro, a + ho)} L ${p(ri, a + hi)} A ${ri.toFixed(2)} ${ri.toFixed(2)} 0 ${large} 0 ${p(ri, a - hi)} Z`;
  };

  // The slot under the pointer: by its angle from the centre, clockwise from the top. Outside
  // the ring, inside the hollow, and in a gap between sectors, there is none.
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (slots === 0 || !format) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * size - outer;
    const y = ((e.clientY - rect.top) / rect.height) * size - outer;
    const r = Math.hypot(x, y);
    if (r < inner || r > outer) { setHover(null); return; }
    const turn = ((Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
    // A wedge spans its slot; a bar sits at the slot's angle.
    setHover(grouped ? Math.floor(turn * slots) % slots : Math.round(turn * slots) % slots);
  };

  const guides = [];
  const bars = [];
  for (let slot = 0; slot < slots; slot++) {
    if (grouped) {
      // The rose: the dim wedge the full radius, the lit one to the value over it.
      const g = groups![slot];
      const len = lengthOf(g.value);
      bars.push(<path key={`t${slot}`} className={styles.wedgeTrack} style={{ strokeWidth: corner * 2 }} d={wedge(slot, outer)} />);
      if (len > 0) {
        const fill = g.color ?? color ?? DEFAULT_COLOR;
        bars.push(
          <path
            key={`w${slot}`}
            className={`${styles.wedge} ${hover === slot ? styles.wedgeHovered : ''}`}
            style={{ fill, stroke: fill, strokeWidth: corner * 2 }}
            d={wedge(slot, inner + len)}
          />,
        );
      }
      continue;
    }
    const [gx1, gy1] = point(slot, inner);
    const [gx2, gy2] = point(slot, outer);
    guides.push(<line key={`g${slot}`} className={styles.guide} x1={gx1} y1={gy1} x2={gx2} y2={gy2} />);
    for (let s = 0; s < lanes; s++) {
      const len = lengthOf(valueAt(s, slot));
      if (len <= 0) continue;
      const [bx1, by1] = point(slot, barFrom, s);
      const [bx2, by2] = point(slot, barTo(len), s);
      const hovered = hover === slot;
      bars.push(
        <line
          key={`b${s}-${slot}`}
          className={`${styles.bar} ${hovered ? styles.hovered : ''}`}
          style={{ stroke: colorOf(s) }}
          x1={bx1} y1={by1} x2={bx2} y2={by2}
        />,
      );
    }
  }

  // The rose's names and values, upright at the wedge's middle, when the wedges are few enough
  // and the face large enough to hold them; the tooltip has them always. A tall wedge carries
  // its text inside, in the page tone as print on it; a short one has it in the dim remainder
  // above, in the ink.
  const sectorLabels = grouped && groups!.length <= 12 && size >= 200 ? groups!.map((g, i) => {
    const len = lengthOf(g.value);
    const onLit = len >= span * 0.5;
    const [tx, ty] = point(i, onLit ? inner + len * 0.62 : inner + len + (span - len) * 0.55);
    return (
      <text key={`l${i}`} className={`${styles.sectorText} ${onLit ? styles.sectorTextOnLit : ''}`} x={tx} y={ty} textAnchor="middle">
        <tspan className={styles.sectorValue} x={tx} dy="-0.2em">{format ? format(g.value, i) : g.value}</tspan>
        <tspan className={styles.sectorName} x={tx} dy="1.3em">{g.label}</tspan>
      </text>
    );
  }) : null;

  const tip = hover != null && format ? (() => {
    const rows = grouped
      ? [{ name: groups![hover].label, color: colorOf(0), text: format(groups![hover].value, hover) }]
      : all.map((s, i) => ({ name: s.label, color: colorOf(i), text: format(s.values[hover] ?? 0, hover) }));
    const longest = Math.max(...all.map((_, i) => lengthOf(valueAt(i, hover))), span * 0.15);
    // At the bar's end: past it from the hollow, or inside it from the rim.
    const [tx, ty] = point(hover, inverse && !grouped ? outer - longest - 6 : inner + longest + 6);
    return (
      <div className={`${styles.tooltip} ${tx > outer ? styles.tooltipLeft : ''}`} style={{ left: tx, top: ty }}>
        {!grouped && <span className={styles.tooltipLabel}>{labels?.[hover] ?? String(hover + 1)}</span>}
        {rows.map((r, i) => (
          <span key={i} className={styles.tooltipRow}>
            {lanes > 1 && <span className={styles.tooltipDot} style={{ background: r.color }} />}
            {(lanes > 1 || grouped) && <span className={styles.tooltipName}>{r.name}</span>}
            <span className={styles.tooltipValue}>{r.text}</span>
          </span>
        ))}
      </div>
    );
  })() : null;

  const start = !grouped && slots > 0 ? (() => {
    const [a, b] = point(0, inner);
    const [c, d] = point(0, outer);
    return <line className={styles.start} x1={a} y1={b} x2={c} y2={d} />;
  })() : null;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div
        className={styles.radial}
        style={{ '--radial-size': `${size}px` } as CSSProperties}
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
          {start}
          {bars}
          {sectorLabels}
        </svg>
        {centre != null && <div className={styles.centre} style={{ width: inner * 2, height: inner * 2 }}>{centre}</div>}
        {tip}
      </div>
      {showLegend && !grouped && lanes > 1 && (
        <div className={styles.legend}>
          {all.map((s, i) => (
            <span key={i} className={styles.legendItem}>
              <span className={styles.legendMark} style={{ background: colorOf(i) }} />
              <span className={styles.legendLabel}>{s.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
