import React, { useRef, useState, useEffect, useCallback, useId } from 'react';
import styles from './Chart.module.css';

const DEFAULT_LINE_COLOR = 'var(--lv4)';

const PAD_TOP = 12;
const PAD_RIGHT = 20;
const PAD_BOTTOM_BASE = 8;
const PAD_BOTTOM_LABELS = 28;
const PAD_LEFT = 20;

/**
 * How a series is filled: a bar, or the area under a line. 'solid' is the series colour, flat
 * on a bar and faint under a line; the patterns are drawn in the series colour on the 2px pixel
 * grid, so two series tell apart in one tone. 'none' leaves a line as a line.
 */
export type ChartFill = 'none' | 'solid' | 'hatch' | 'dots' | 'checker';

export interface ChartSeries {
  label: string;
  data: number[];
  color?: string;
  hoverColor?: string;
  /** Bars are 'solid' unless told otherwise; a line is 'none', a wire, unless given an area. */
  fill?: ChartFill;
  /**
   * Lines only: a range around the line, one value per point, drawn as a band behind it. The
   * band is faint in the series colour, or its pattern when `fill` is one; the area under the
   * line is then not drawn. Latency as p50 with p5 to p95, a forecast with its spread.
   */
  low?: number[];
  high?: number[];
  /** What the range is, for the tooltip: "p5 to p95". "Range" when left out. */
  rangeLabel?: string;
  /**
   * Lines only: the value holds flat until the next point and then jumps, for what does not
   * move between samples: a record count, a state, a quota that changes on a date.
   */
  step?: boolean;
}

// The pixel patterns, each a 4px tile of 1px or 2px cells in the series colour.
const PATTERN_CELLS: Record<Exclude<ChartFill, 'none' | 'solid'>, [x: number, y: number, w: number, h: number][]> = {
  hatch: [[0, 3, 1, 1], [1, 2, 1, 1], [2, 1, 1, 1], [3, 0, 1, 1]],
  dots: [[0, 0, 2, 2]],
  checker: [[0, 0, 2, 2], [2, 2, 2, 2]],
};

/** The faintness of a solid area under a line, so the midline and other lines show through. */
const AREA_OPACITY = 0.14;

/** A level to read the data against: a threshold, an average, a quota, the value now. */
export interface ChartReference {
  value: number;
  /** Shown in a tag at the right end of the line; the formatted value when left out. */
  label?: string;
  /** The line's and the tag's colour: the signal red for a limit. The ink by default. */
  color?: string;
  /** A limit: whatever lies above the line is drawn in the signal red, bars and points alike. */
  signal?: boolean;
}

const SIGNAL = 'var(--CSignal)';

/** A point where something happened (a change, a release), and what it was. */
export interface ChartMarker {
  index: number;
  label: string;
}

export interface ChartProps {
  series: ChartSeries[];
  labels?: string[];
  type?: 'line' | 'bar';
  height?: number;
  showLegend?: boolean;
  className?: string;
  /**
   * Points where something happened. Drawn as a small square on the baseline under the point and
   * listed in its tooltip. Several may share a point.
   */
  markers?: ChartMarker[];
  /**
   * A value axis at the left or right: round ticks with a faint gridline each, the range widened
   * to the ticks. Without it the chart keeps its midline and reads by the tooltip.
   */
  yAxis?: 'none' | 'left' | 'right';
  /** The tick labels, and a reference's label when it has none; compact by default: 1.2k, 3M. */
  yFormat?: (value: number) => string;
  /** Levels to read the data against, each a dashed line with its label in a tag at the right. */
  references?: ChartReference[];
  /**
   * Bars only: the series on top of each other in one bar per label, in series order from the
   * baseline, so the bar's height is the total. The tooltip lists each part and the total.
   */
  stacked?: boolean;
}

// A round step for about four ticks over the range: 1, 2 or 5 times a power of ten.
function niceStep(range: number, count = 4): number {
  const raw = range / count || 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const n = raw / magnitude;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * magnitude;
}

function compact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${trim(v / 1e6)}M`;
  if (abs >= 1e3) return `${trim(v / 1e3)}k`;
  return trim(v);
}

function trim(v: number): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: Math.abs(v) < 10 ? 2 : 1 });
}

interface TooltipState {
  index: number;
  x: number;
  y: number;
}

function formatValue(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function Chart({
  series,
  labels,
  type = 'line',
  height = 200,
  showLegend = true,
  className,
  markers,
  yAxis = 'none',
  yFormat = compact,
  references,
  stacked = false,
}: ChartProps) {
  const isStacked = stacked && type === 'bar';
  const containerRef = useRef<HTMLDivElement>(null);
  const patternId = useId();
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const padBottom = labels?.length ? PAD_BOTTOM_LABELS : PAD_BOTTOM_BASE;
  const ch = Math.max(height - PAD_TOP - padBottom, 0);

  // The range: the data, and any reference, which must be in view to be read against. With an
  // axis the range widens to round ticks, so the top gridline carries a label.
  const dataLenAll = Math.max(...series.map(s => s.data.length), 0);
  // Stacked, the range is set by the totals per label, not the parts.
  const totals = isStacked
    ? Array.from({ length: dataLenAll }, (_, i) => series.reduce((a, s) => a + Math.max(0, s.data[i] ?? 0), 0))
    : [];
  const allValues = isStacked
    ? totals
    : series.flatMap(s => [...s.data, ...(type === 'line' ? [...(s.low ?? []), ...(s.high ?? [])] : [])].filter(Number.isFinite));
  const refValues = (references ?? []).map(r => r.value).filter(Number.isFinite);
  let maxVal = allValues.length || refValues.length ? Math.max(...allValues, ...refValues, 0) : 1;
  let minVal = type === 'bar' ? Math.min(0, ...refValues) : Math.min(...allValues, ...refValues, 0);
  const hasAxis = yAxis !== 'none';
  const step = niceStep(maxVal - minVal);
  if (hasAxis) {
    maxVal = Math.ceil(maxVal / step - 1e-9) * step;
    minVal = Math.floor(minVal / step + 1e-9) * step;
  }
  const range = maxVal - minVal || 1;
  const ticks: number[] = [];
  if (hasAxis) for (let t = minVal; t <= maxVal + step / 2; t += step) ticks.push(Number(t.toFixed(10)));

  // Roughly the width of one --text-2xs character, and the gap kept between two labels.
  const LABEL_CHAR_WIDTH = 6, LABEL_GAP = 12, MIN_MARKER_SPACING = 12;

  // The side paddings make room for the axis labels and the reference tags, which sit outside
  // the plot at the right. 20px is the margin a chart has without either.
  const refLabelOf = (r: ChartReference) => r.label ?? yFormat(r.value);
  const axisWidth = hasAxis ? Math.max(...ticks.map(t => yFormat(t).length)) * LABEL_CHAR_WIDTH + 10 : 0;
  const tagWidth = references?.length ? Math.max(...references.map(r => refLabelOf(r).length)) * LABEL_CHAR_WIDTH + 8 : 0;
  const padLeft = yAxis === 'left' ? axisWidth + 4 : PAD_LEFT;
  const padRight = Math.max(yAxis === 'right' ? axisWidth + 4 : PAD_RIGHT, tagWidth ? tagWidth + 6 : 0);
  const cw = Math.max(containerWidth - padLeft - padRight, 0);
  const dataLen = Math.max(...series.map(s => s.data.length), 0);

  // Every how many points a label is drawn: as many as fit side by side at the current width,
  // so 90 daily labels on a phone become a readable handful.
  const labelStep = (() => {
    if (!labels || labels.length <= 1 || cw <= 0) return 1;
    const widest = Math.max(...labels.map(l => l.length)) * LABEL_CHAR_WIDTH + LABEL_GAP;
    const fit = Math.max(Math.floor(cw / widest), 1);
    return Math.ceil(labels.length / fit);
  })();

  // Whether points are far enough apart to each carry a marker. When they are not, the markers
  // merge into a second, thicker line, so only the hovered point gets one.
  const roomForMarkers = dataLen <= 1 || cw / (dataLen - 1) >= MIN_MARKER_SPACING;

  const toY = (v: number) => PAD_TOP + (1 - (v - minVal) / range) * ch;
  const baseY = toY(Math.max(minVal, 0));

  // The points of a series as "x,y" pairs; with step, a corner at each new x holding the last
  // value, so the line runs flat and then jumps.
  const pointsOf = (values: number[], step: boolean | undefined, n = values.length) => {
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      if (step && i > 0) out.push(`${toX(i).toFixed(2)},${toY(values[i - 1]).toFixed(2)}`);
      out.push(`${toX(i).toFixed(2)},${toY(values[i]).toFixed(2)}`);
    }
    return out;
  };

  // A limit: the plot above the lowest signal reference is drawn again in the signal red,
  // clipped to that region, so what lies past the limit says so.
  const signalRefs = (references ?? []).filter(r => r.signal && Number.isFinite(r.value));
  const signalY = signalRefs.length ? toY(Math.min(...signalRefs.map(r => r.value))) : null;
  const signalClipId = `${patternId}-signal`;

  // ── Fills ────────────────────────────────────────────────────────

  const fillOf = (s: ChartSeries): ChartFill => s.fill ?? (type === 'bar' ? 'solid' : 'none');
  const colorOf = (s: ChartSeries) => s.color ?? (type === 'bar' ? 'var(--chart-bar)' : DEFAULT_LINE_COLOR);
  const patternRef = (si: number) => `url(#${patternId}-${si})`;
  // What a shape is painted with: the colour, or the series' pattern in that colour.
  const paintOf = (s: ChartSeries, si: number) => {
    const fill = fillOf(s);
    return fill === 'hatch' || fill === 'dots' || fill === 'checker' ? patternRef(si) : colorOf(s);
  };

  const patternDefs = series.some((s) => fillOf(s) in PATTERN_CELLS) ? (
    <defs>
      {series.map((s, si) => {
        const fill = fillOf(s);
        if (!(fill in PATTERN_CELLS)) return null;
        const cells = PATTERN_CELLS[fill as keyof typeof PATTERN_CELLS];
        return (
          <pattern key={si} id={`${patternId}-${si}`} width={4} height={4} patternUnits="userSpaceOnUse">
            {cells.map(([x, y, w, h], ci) => (
              <rect key={ci} x={x} y={y} width={w} height={h} fill={colorOf(s)} />
            ))}
          </pattern>
        );
      })}
    </defs>
  ) : null;
  const toX = (i: number) =>
    dataLen <= 1 ? padLeft + cw / 2 : padLeft + (i / (dataLen - 1)) * cw;

  // ── Hover ────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dataLen === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (type === 'line') {
      const idx = Math.round(((mouseX - padLeft) / cw) * (dataLen - 1));
      setTooltip({ index: Math.max(0, Math.min(dataLen - 1, idx)), x: mouseX, y: mouseY });
    } else {
      const colW = cw / dataLen;
      const idx = Math.floor((mouseX - padLeft) / colW);
      setTooltip({ index: Math.max(0, Math.min(dataLen - 1, idx)), x: mouseX, y: mouseY });
    }
  }, [type, dataLen, cw]);

  // A touch lifts off with a pointerleave; clearing then would close the tooltip the tap just
  // opened. Only a mouse leaving clears it.
  const handlePointerLeave = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') setTooltip(null);
  }, []);

  // ── Midline ──────────────────────────────────────────────────────

  // With an axis the ticks' gridlines take the midline's place.
  const midline = hasAxis ? null : (
    <line
      x1={padLeft} y1={PAD_TOP + ch * 0.5}
      x2={padLeft + cw} y2={PAD_TOP + ch * 0.5}
      stroke="var(--chart-midline)"
      strokeWidth="0.5"
    />
  );

  // ── Value axis ───────────────────────────────────────────────────

  // A reference's tag takes a tick label's place at the right, so a label the tag would cover
  // is left out.
  const refYs = (references ?? []).filter(r => Number.isFinite(r.value)).map(r => toY(r.value));
  const coveredByTag = (y: number) => yAxis === 'right' && refYs.some(ry => Math.abs(ry - y) < 12);

  const axis = hasAxis ? (
    <g>
      {ticks.map(t => {
        const y = toY(t);
        const labelX = yAxis === 'left' ? padLeft - 6 : padLeft + cw + 6;
        return (
          <g key={t}>
            {t !== minVal && (
              <line x1={padLeft} y1={y} x2={padLeft + cw} y2={y} stroke="var(--chart-midline)" strokeWidth="0.5" />
            )}
            {!coveredByTag(y) && <text
              x={labelX}
              y={y + 3}
              textAnchor={yAxis === 'left' ? 'end' : 'start'}
              fill="var(--lv4)"
              style={{ font: 'var(--text-2xs)' }}
            >
              {yFormat(t)}
            </text>}
          </g>
        );
      })}
    </g>
  ) : null;

  // ── References ───────────────────────────────────────────────────

  // A dashed line across the plot at the value, its label in an inverted tag just outside the
  // right edge, centred on the line.
  const referenceLines = references?.filter(r => Number.isFinite(r.value)).map((r, ri) => {
    const y = toY(r.value);
    const color = r.color ?? 'var(--lv8)';
    const label = refLabelOf(r);
    const w = label.length * LABEL_CHAR_WIDTH + 8;
    return (
      <g key={ri}>
        <line x1={padLeft} y1={y} x2={padLeft + cw} y2={y} stroke={color} strokeWidth="1" strokeDasharray="3 3" />
        <rect x={padLeft + cw + 4} y={y - 7} width={w} height={14} fill={color} />
        <text x={padLeft + cw + 8} y={y + 3} fill="var(--lv0)" style={{ font: 'var(--text-2xs)' }}>
          {label}
        </text>
      </g>
    );
  });

  // ── Baseline ─────────────────────────────────────────────────────

  const baseline = (
    <line
      x1={padLeft} y1={PAD_TOP + ch}
      x2={padLeft + cw} y2={PAD_TOP + ch}
      stroke="var(--chart-baseline)"
      strokeWidth="1"
    />
  );

  // ── Column hover (bar chart) ──────────────────────────────────────

  const columnHighlight = tooltip && type === 'bar' ? (() => {
    const colW = cw / dataLen;
    return (
      <rect
        x={padLeft + tooltip.index * colW}
        y={PAD_TOP}
        width={colW}
        height={ch}
        fill="var(--chart-column-hover)"
      />
    );
  })() : null;

  // ── Line chart ───────────────────────────────────────────────────

  // With a paint, the signal copy: the line and its points in that colour, no band or area.
  const renderLines = (paint?: string) =>
    series.map((s, si) => {
      if (!s.data.length) return null;
      const color = paint ?? s.color ?? DEFAULT_LINE_COLOR;
      const pts = pointsOf(s.data, s.step).join(' ');
      const fill = fillOf(s);
      const hasBand = !paint && !!(s.low && s.high && s.low.length && s.high.length);
      // The band between low and high: along high to the right, back along low.
      const band = hasBand ? (() => {
        const n = Math.min(s.data.length, s.low!.length, s.high!.length);
        if (n < 2) return null;
        const top = pointsOf(s.high!, s.step, n);
        const back = pointsOf(s.low!, s.step, n).reverse();
        const patterned = fill in PATTERN_CELLS;
        return (
          <polygon
            points={[...top, ...back].join(' ')}
            fill={patterned ? patternRef(si) : color}
            fillOpacity={patterned ? 1 : AREA_OPACITY}
            stroke="none"
          />
        );
      })() : null;
      // The area under the line, down to the baseline (or zero, where the range goes below it).
      const area = !paint && !hasBand && fill !== 'none' && s.data.length > 1 ? (
        <polygon
          points={`${toX(0).toFixed(2)},${baseY.toFixed(2)} ${pts} ${toX(s.data.length - 1).toFixed(2)},${baseY.toFixed(2)}`}
          fill={paintOf(s, si)}
          fillOpacity={fill === 'solid' ? AREA_OPACITY : 1}
          stroke="none"
        />
      ) : null;

      return (
        <g key={`${paint ? 'signal-' : ''}${si}`}>
          {band}
          {area}
          <polyline points={pts} fill="none" stroke={color} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />
          {s.data.map((v, i) => {
            const active = tooltip?.index === i;
            if (!active && !roomForMarkers) return null;
            const size = active ? (roomForMarkers ? 10 : 7) : 5;
            const half = size / 2;
            return (
              <rect
                key={i}
                x={toX(i) - half} y={toY(v) - half}
                width={size} height={size}
                fill={color}
              />
            );
          })}
        </g>
      );
    });

  // ── Bar chart ────────────────────────────────────────────────────

  const renderBars = (paint?: string) => {
    if (!dataLen) return null;
    const seriesCount = isStacked ? 1 : series.length;
    const groupW = cw / dataLen;
    const barGap = 2;
    const barW = Math.max((groupW - barGap * (seriesCount + 1)) / seriesCount, 2);
    const bottom = PAD_TOP + ch;
    // Stacked: each series starts where the ones before it ended.
    const stackBase = new Array<number>(dataLen).fill(0);

    return series.map((s, si) =>
      s.data.map((v, i) => {
        const bx = isStacked ? padLeft + i * groupW + barGap : padLeft + i * groupW + barGap + si * (barW + barGap);
        const part = isStacked ? Math.max(0, v) : v;
        const from = isStacked ? stackBase[i] : 0;
        if (isStacked) stackBase[i] += part;
        const by = toY(from + part);
        const bh = isStacked ? Math.max(toY(from) - by, 0) : Math.max(bottom - by, 0);
        return (
          <rect
            key={`${paint ? 'signal-' : ''}${si}-${i}`}
            x={bx} y={by}
            width={barW} height={bh}
            fill={paint ?? paintOf(s, si)}
          />
        );
      })
    );
  };

  // ── X-axis labels ─────────────────────────────────────────────────

  const renderLabels = () => {
    if (!labels?.length) return null;
    const y = PAD_TOP + ch + 18;
    const last = labels.length - 1;
    return labels.map((lbl, i) => {
      // Counted from the end, so the latest point always keeps its label.
      if ((last - i) % labelStep !== 0) return null;
      const x = type === 'line' ? toX(i) : padLeft + (i + 0.5) * (cw / dataLen);
      // On a line chart the end labels sit on the plot's edges; anchor them inwards so the frame
      // does not clip them.
      const anchor = type !== 'line' || last === 0 ? 'middle' : i === 0 ? 'start' : i === last ? 'end' : 'middle';
      return (
        <text key={i} x={x} y={y} textAnchor={anchor} fill="var(--lv4)" style={{ font: 'var(--text-2xs)' }}>
          {lbl}
        </text>
      );
    });
  };

  // ── Crosshair (line chart only) ───────────────────────────────────

  const crosshair = tooltip && type === 'line' ? (
    <line
      x1={toX(tooltip.index)} y1={PAD_TOP}
      x2={toX(tooltip.index)} y2={PAD_TOP + ch}
      stroke="var(--chart-crosshair)"
      strokeWidth="1"
      strokeDasharray="3 3"
    />
  ) : null;

  // ── Tooltip ───────────────────────────────────────────────────────

  const tooltipEl = tooltip ? (() => {
    const label = labels?.[tooltip.index] ?? String(tooltip.index + 1);
    // Kept inside the frame, which clips. The box's size is estimated from its rows and its
    // longest name (a row is 20px, a character about 6.5px), since it is not measured before it
    // is drawn. Beside the pointed column, never on it: to its right when it fits there, else to
    // its left, at the pointer's height. Above or below the pointer it covered what it describes.
    const rowCount = series.length
      + series.filter(s => s.low && s.high && s.low[tooltip.index] != null && s.high[tooltip.index] != null).length
      + (isStacked && series.length > 1 ? 1 : 0)
      + (markers?.filter(m => m.index === tooltip.index).length ?? 0);
    const longest = Math.max(label.length, ...series.map(s => s.label.length + 8), ...(markers?.map(m => m.label.length) ?? [0]));
    const tipW = Math.min(Math.max(90, longest * 6.5 + 36), Math.max(120, containerWidth - 16));
    const tipH = 30 + rowCount * 20;
    // From the hovered bar's edge, or from the point on a line, rather than from the pointer.
    const gap = 12;
    const half = type === 'bar' && dataLen > 0 ? cw / dataLen / 2 : 0;
    const cx = type === 'bar' && dataLen > 0 ? padLeft + (tooltip.index + 0.5) * (cw / dataLen) : toX(tooltip.index);
    const left = cx + half + gap + tipW <= containerWidth - 4 ? cx + half + gap : Math.max(4, cx - half - gap - tipW);
    const top = Math.max(4, Math.min(tooltip.y - tipH / 2, height - tipH - 4));
    const style = { left, top };
    return (
      <div className={styles.tooltip} style={style}>
        <div className={styles.tooltipLabel}>{label}</div>
        {series.map((s, si) => (
          <React.Fragment key={si}>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipDot} style={{ background: s.color ?? DEFAULT_LINE_COLOR }} />
              <span className={styles.tooltipName}>{s.label}</span>
              <span className={styles.tooltipValue}>{formatValue(s.data[tooltip.index] ?? 0)}</span>
            </div>
            {s.low && s.high && s.low[tooltip.index] != null && s.high[tooltip.index] != null && (
              <div className={`${styles.tooltipRow} ${styles.tooltipRange}`}>
                <span className={styles.tooltipDot} style={{ visibility: 'hidden' }} />
                <span className={styles.tooltipName}>{s.rangeLabel ?? 'Range'}</span>
                <span className={styles.tooltipRangeValue}>{formatValue(s.low[tooltip.index])} to {formatValue(s.high[tooltip.index])}</span>
              </div>
            )}
          </React.Fragment>
        ))}
        {isStacked && series.length > 1 && (
          <div className={`${styles.tooltipRow} ${styles.tooltipTotal}`}>
            <span className={styles.tooltipDot} style={{ visibility: 'hidden' }} />
            <span className={styles.tooltipName}>Total</span>
            <span className={styles.tooltipValue}>{formatValue(totals[tooltip.index] ?? 0)}</span>
          </div>
        )}
        {markers?.filter(m => m.index === tooltip.index).map((m, mi) => (
          <div key={`m${mi}`} className={`${styles.tooltipRow} ${styles.tooltipMarker}`}>
            <span className={`${styles.tooltipDot} ${styles.markerDot}`} />
            <span className={styles.tooltipName}>{m.label}</span>
          </div>
        ))}
      </div>
    );
  })() : null;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <div ref={containerRef} className={styles.chart} style={{ height }}>
        {containerWidth > 0 && (
          <svg
            width={containerWidth}
            height={height}
            className={styles.svg}
            onPointerMove={handleMouseMove}
            onPointerDown={handleMouseMove}
            onPointerLeave={handlePointerLeave}
          >
            {patternDefs}
            {midline}
            {axis}
            {baseline}
            {columnHighlight}
            {crosshair}
            {type === 'line' ? renderLines() : renderBars()}
            {signalY != null && signalY > PAD_TOP && (
              <>
                <defs>
                  <clipPath id={signalClipId}>
                    <rect x={padLeft} y={PAD_TOP} width={cw} height={signalY - PAD_TOP} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${signalClipId})`}>
                  {type === 'line' ? renderLines(SIGNAL) : renderBars(SIGNAL)}
                </g>
              </>
            )}
            {/* Markers: drawn after the data so a bar cannot hide them, one square per point. */}
            {markers && dataLen > 0 &&
              [...new Set(markers.map(m => m.index).filter(i => i >= 0 && i < dataLen))].map(i => {
                const mx = type === 'line' ? toX(i) : padLeft + (i + 0.5) * (cw / dataLen);
                return <rect key={`m${i}`} className={styles.marker} x={mx - 3} y={PAD_TOP + ch - 3} width={6} height={6} />;
              })}
            {renderLabels()}
            {/* References last, so a bar or an area cannot cover the line or its tag. */}
            {referenceLines}
          </svg>
        )}
        {tooltipEl}
      </div>
      {showLegend && series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s, i) => (
            <div key={i} className={styles.legendItem}>
              {fillOf(s) in PATTERN_CELLS ? (
                <svg className={styles.legendSwatch} width={12} height={8} aria-hidden="true">
                  <rect width={12} height={8} fill={patternRef(i)} />
                </svg>
              ) : (
                // The bar tone token lives on the chart frame, so out here a bar's mark takes the line grey.
                <div className={styles.legendMark} style={{ background: s.color ?? DEFAULT_LINE_COLOR }} />
              )}
              <span className={styles.legendLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
