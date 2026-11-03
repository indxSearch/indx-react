import { useId, useState, type CSSProperties, type PointerEvent } from 'react';
import styles from './RadarChart.module.css';

// A shape across a few dimensions: an axis a dimension from the centre to the rim, the name
// at its end, two or three faint rings for the scale, and a series as a 1px polygon through
// its value on each axis with the Chart's square markers at the corners and a fill, solid and
// faint or a pixel pattern, so two shapes tell apart in one tone. For comparing profiles: a
// dataset this month against last, two datasets. Hover reads the axis nearest the pointer's
// angle and lists every series' value on it. One shared scale, or a max per axis for
// dimensions in different units.

export type RadarFill = 'none' | 'solid' | 'hatch' | 'dots' | 'checker';

export interface RadarAxis {
  label: string;
  /** This axis's own ceiling, for a dimension in its own unit; the chart's max otherwise. */
  max?: number;
  /** This axis's value as shown in the tooltip; the chart's format otherwise. */
  format?: (value: number) => string;
}

export interface RadarSeries {
  label: string;
  /** One value an axis, in the axes' order. */
  values: number[];
  /** The line's and markers' colour; the first series is the ink, the rest need one. */
  color?: string;
  /** The shape's fill; 'solid' by default, faint in the colour. */
  fill?: RadarFill;
}

export interface RadarChartProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  /** The diameter of the rim in pixels, the names outside it; 240 by default. */
  size?: number;
  /** The value that reaches the rim on every axis without a max of its own; the largest by default. */
  max?: number;
  /** The scale rings inside the rim; 3 by default. */
  rings?: number;
  /** A value as shown in the tooltip; the number by default. */
  format?: (value: number) => string;
  /** The legend under the chart with several series; on by default. */
  showLegend?: boolean;
  /** A name for assistive technology: "Dataset profile, this month and last". */
  'aria-label'?: string;
  className?: string;
}

const DEFAULT_COLOR = 'var(--lv6)';
const AREA_OPACITY = 0.14;
// A pattern is drawn a little translucent, so a shape under it still shows through.
const PATTERN_OPACITY = 0.7;
// Room outside the rim for the names: at least this, more for a long one (6.5px a character).
const LABEL_LINE = 28;
const MIN_LABEL_ROOM = 36;
const PATTERN_CELLS: Record<Exclude<RadarFill, 'none' | 'solid'>, [number, number, number, number][]> = {
  hatch: [[0, 3, 1, 1], [1, 2, 1, 1], [2, 1, 1, 1], [3, 0, 1, 1]],
  dots: [[0, 0, 2, 2]],
  checker: [[0, 0, 2, 2], [2, 2, 2, 2]],
};

export function RadarChart({
  axes,
  series,
  size = 240,
  max,
  rings = 3,
  format,
  showLegend = true,
  'aria-label': ariaLabel,
  className = '',
}: RadarChartProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const n = axes.length;
  const radius = size / 2;
  const labelRoom = Math.max(MIN_LABEL_ROOM, Math.max(0, ...axes.map((a) => a.label.length)) * 6.5 + 14);
  // Wide enough for a name at either side, but only a line's height above and below: the names at
  // the top and bottom are centred on their axis, so side room there was empty.
  const boxW = size + labelRoom * 2;
  const boxH = size + LABEL_LINE * 2;
  const cx = boxW / 2;
  const cy = boxH / 2;
  const top = max ?? series.reduce((a, s) => s.values.reduce((b, v) => (Number.isFinite(v) && v > b ? v : b), a), 0);
  const ceilingOf = (i: number) => axes[i].max ?? top;
  const angleOf = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, n);
  const point = (i: number, r: number) => [cx + r * Math.cos(angleOf(i)), cy + r * Math.sin(angleOf(i))] as const;
  const radiusOf = (i: number, v: number) => {
    const c = ceilingOf(i);
    return c > 0 && Number.isFinite(v) ? Math.min(1, Math.max(0, v / c)) * radius : 0;
  };
  const colorOf = (s: RadarSeries) => s.color ?? DEFAULT_COLOR;
  const show = (i: number, v: number) => axes[i].format?.(v) ?? format?.(v) ?? v.toLocaleString();

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * boxW - cx;
    const y = ((e.clientY - rect.top) / rect.height) * boxH - cy;
    if (Math.hypot(x, y) > radius + labelRoom) { setHover(null); return; }
    const turn = ((Math.atan2(y, x) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
    setHover(Math.round(turn * n) % n);
  };

  const ringPaths = Array.from({ length: rings }, (_, k) => {
    const r = (radius * (k + 1)) / rings;
    return Array.from({ length: n }, (_, i) => point(i, r).map((v) => v.toFixed(2)).join(',')).join(' ');
  });

  const patterned = series.filter((s) => s.fill && s.fill in PATTERN_CELLS);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.radar} style={{ '--radar-width': `${boxW}px`, '--radar-height': `${boxH}px` } as CSSProperties} onPointerLeave={() => setHover(null)}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${boxW} ${boxH}`}
          width={boxW}
          height={boxH}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
        >
          {patterned.length > 0 && (
            <defs>
              {series.map((s, si) => s.fill && s.fill in PATTERN_CELLS ? (
                <pattern key={si} id={`${id}-${si}`} width={4} height={4} patternUnits="userSpaceOnUse">
                  {PATTERN_CELLS[s.fill as keyof typeof PATTERN_CELLS].map(([x, y, w, h], ci) => (
                    <rect key={ci} x={x} y={y} width={w} height={h} fill={colorOf(s)} />
                  ))}
                </pattern>
              ) : null)}
            </defs>
          )}
          {ringPaths.map((pts, k) => (
            <polygon key={`r${k}`} className={k === rings - 1 ? styles.rim : styles.ring} points={pts} />
          ))}
          {axes.map((_, i) => {
            const [x, y] = point(i, radius);
            return <line key={`a${i}`} className={`${styles.axis} ${hover === i ? styles.axisHovered : ''}`} x1={cx} y1={cy} x2={x} y2={y} />;
          })}
          {series.map((s, si) => {
            const pts = axes.map((_, i) => point(i, radiusOf(i, s.values[i])));
            const fill = s.fill ?? 'solid';
            const paint = fill in PATTERN_CELLS ? `url(#${id}-${si})` : colorOf(s);
            return (
              <g key={`s${si}`}>
                {fill !== 'none' && (
                  <polygon
                    points={pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}
                    fill={paint}
                    fillOpacity={fill === 'solid' ? AREA_OPACITY : PATTERN_OPACITY}
                    stroke="none"
                  />
                )}
                <polygon
                  points={pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}
                  fill="none"
                  stroke={colorOf(s)}
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                {pts.map(([x, y], i) => {
                  const active = hover === i;
                  const w = active ? 7 : 5;
                  return <rect key={i} x={x - w / 2} y={y - w / 2} width={w} height={w} fill={colorOf(s)} />;
                })}
              </g>
            );
          })}
          {axes.map((a, i) => {
            const [x, y] = point(i, radius + 10);
            const cos = Math.cos(angleOf(i));
            const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
            const dy = Math.sin(angleOf(i)) > 0.5 ? '0.9em' : Math.sin(angleOf(i)) < -0.5 ? '-0.2em' : '0.35em';
            return (
              <text key={`l${i}`} className={`${styles.label} ${hover === i ? styles.labelHovered : ''}`} x={x} y={y} dy={dy} textAnchor={anchor}>
                {a.label}
              </text>
            );
          })}
        </svg>
        {hover != null && (() => {
          const [x, y] = point(hover, radius + 10);
          const left = x > cx;
          return (
            <div className={`${styles.tooltip} ${left ? styles.tooltipLeft : ''}`} style={{ left: x, top: y }}>
              <span className={styles.tooltipLabel}>{axes[hover].label}</span>
              {series.map((s, si) => (
                <span key={si} className={styles.tooltipRow}>
                  {series.length > 1 && <span className={styles.tooltipDot} style={{ background: colorOf(s) }} />}
                  {series.length > 1 && <span className={styles.tooltipName}>{s.label}</span>}
                  <span className={styles.tooltipValue}>{show(hover, s.values[hover] ?? 0)}</span>
                </span>
              ))}
            </div>
          );
        })()}
      </div>
      {showLegend && series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s, si) => (
            <span key={si} className={styles.legendItem}>
              <span className={styles.legendMark} style={{ background: colorOf(s) }} />
              <span className={styles.legendLabel}>{s.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
