import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './Chart.module.css';

const DEFAULT_LINE_COLOR = 'var(--lv4)';

const PAD_TOP = 12;
const PAD_RIGHT = 20;
const PAD_BOTTOM_BASE = 8;
const PAD_BOTTOM_LABELS = 28;
const PAD_LEFT = 20;

export interface ChartSeries {
  label: string;
  data: number[];
  color?: string;
  hoverColor?: string;
}

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
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const cw = Math.max(containerWidth - PAD_LEFT - PAD_RIGHT, 0);
  const ch = Math.max(height - PAD_TOP - padBottom, 0);

  const allValues = series.flatMap(s => s.data.filter(Number.isFinite));
  const maxVal = allValues.length ? Math.max(...allValues, 0) : 1;
  const minVal = type === 'bar' ? 0 : Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const dataLen = Math.max(...series.map(s => s.data.length), 0);

  // Roughly the width of one --text-2xs character, and the gap kept between two labels.
  const LABEL_CHAR_WIDTH = 6, LABEL_GAP = 12, MIN_MARKER_SPACING = 12;

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
  const toX = (i: number) =>
    dataLen <= 1 ? PAD_LEFT + cw / 2 : PAD_LEFT + (i / (dataLen - 1)) * cw;

  // ── Hover ────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (dataLen === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (type === 'line') {
      const idx = Math.round(((mouseX - PAD_LEFT) / cw) * (dataLen - 1));
      setTooltip({ index: Math.max(0, Math.min(dataLen - 1, idx)), x: mouseX, y: mouseY });
    } else {
      const colW = cw / dataLen;
      const idx = Math.floor((mouseX - PAD_LEFT) / colW);
      setTooltip({ index: Math.max(0, Math.min(dataLen - 1, idx)), x: mouseX, y: mouseY });
    }
  }, [type, dataLen, cw]);

  // A touch lifts off with a pointerleave; clearing then would close the tooltip the tap just
  // opened. Only a mouse leaving clears it.
  const handlePointerLeave = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') setTooltip(null);
  }, []);

  // ── Midline ──────────────────────────────────────────────────────

  const midline = (
    <line
      x1={PAD_LEFT} y1={PAD_TOP + ch * 0.5}
      x2={PAD_LEFT + cw} y2={PAD_TOP + ch * 0.5}
      stroke="var(--chart-midline)"
      strokeWidth="0.5"
    />
  );

  // ── Baseline ─────────────────────────────────────────────────────

  const baseline = (
    <line
      x1={PAD_LEFT} y1={PAD_TOP + ch}
      x2={PAD_LEFT + cw} y2={PAD_TOP + ch}
      stroke="var(--chart-baseline)"
      strokeWidth="1"
    />
  );

  // ── Column hover (bar chart) ──────────────────────────────────────

  const columnHighlight = tooltip && type === 'bar' ? (() => {
    const colW = cw / dataLen;
    return (
      <rect
        x={PAD_LEFT + tooltip.index * colW}
        y={PAD_TOP}
        width={colW}
        height={ch}
        fill="var(--chart-column-hover)"
      />
    );
  })() : null;

  // ── Line chart ───────────────────────────────────────────────────

  const renderLines = () =>
    series.map((s, si) => {
      if (!s.data.length) return null;
      const color = s.color ?? DEFAULT_LINE_COLOR;
      const pts = s.data.map((v, i) => `${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(' ');

      return (
        <g key={si}>
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

  const renderBars = () => {
    if (!dataLen) return null;
    const seriesCount = series.length;
    const groupW = cw / dataLen;
    const barGap = 2;
    const barW = Math.max((groupW - barGap * (seriesCount + 1)) / seriesCount, 2);
    const bottom = PAD_TOP + ch;

    return series.map((s, si) =>
      s.data.map((v, i) => {
        const bx = PAD_LEFT + i * groupW + barGap + si * (barW + barGap);
        const by = toY(v);
        const bh = Math.max(bottom - by, 0);
        return (
          <rect
            key={`${si}-${i}`}
            x={bx} y={by}
            width={barW} height={bh}
            fill={s.color ?? 'var(--chart-bar)'}
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
      const x = type === 'line' ? toX(i) : PAD_LEFT + (i + 0.5) * (cw / dataLen);
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
    const tipX = Math.min(Math.max(tooltip.x, 60), containerWidth - 60);
    return (
      <div
        className={styles.tooltip}
        style={
          tooltip.y < 80
            ? { left: tipX, top: tooltip.y + 12, transform: 'translate(-50%, 0)' }
            : { left: tipX, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }
        }
      >
        <div className={styles.tooltipLabel}>{label}</div>
        {series.map((s, si) => (
          <div key={si} className={styles.tooltipRow}>
            <span className={styles.tooltipDot} style={{ background: s.color ?? DEFAULT_LINE_COLOR }} />
            <span className={styles.tooltipName}>{s.label}</span>
            <span className={styles.tooltipValue}>{formatValue(s.data[tooltip.index] ?? 0)}</span>
          </div>
        ))}
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
            {midline}
            {baseline}
            {columnHighlight}
            {crosshair}
            {type === 'line' ? renderLines() : renderBars()}
            {/* Markers: drawn after the data so a bar cannot hide them, one square per point. */}
            {markers && dataLen > 0 &&
              [...new Set(markers.map(m => m.index).filter(i => i >= 0 && i < dataLen))].map(i => {
                const mx = type === 'line' ? toX(i) : PAD_LEFT + (i + 0.5) * (cw / dataLen);
                return <rect key={`m${i}`} className={styles.marker} x={mx - 3} y={PAD_TOP + ch - 3} width={6} height={6} />;
              })}
            {renderLabels()}
          </svg>
        )}
        {tooltipEl}
      </div>
      {showLegend && series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s, i) => (
            <div key={i} className={styles.legendItem}>
              <div className={styles.legendMark} style={{ background: s.color ?? DEFAULT_LINE_COLOR }} />
              <span className={styles.legendLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
