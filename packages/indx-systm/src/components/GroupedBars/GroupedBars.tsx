import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import styles from './GroupedBars.module.css';

// Thin bars in labelled groups across the width: a group a day and a bar an hour, a group a
// week and a bar a day. A hairline marks where each group starts, with its name and a figure
// above; a band under each group carries its colour when it is highlighted, so one group
// stands out from the rest. The sample labels sit under the band, as many as fit. For a
// week of hours, a quarter of weeks. Hover reads a bar by x, as Chart does.

export interface BarGroup {
  label: string;
  /** A figure beside the name: the group's total, its share. */
  sublabel?: ReactNode;
  values: number[];
  /** The bars' and the band's colour when highlighted; the teal is the usual choice. */
  color?: string;
  /** This group stands out: its bars and band in its colour, the rest in the ink. */
  highlight?: boolean;
}

export interface GroupedBarsProps {
  groups: BarGroup[];
  /** What each sample in a group is, for the tooltip and the labels under the band: the hours. */
  labels?: string[];
  /** The bars' height in pixels; 120 by default. */
  height?: number;
  /** The value that reaches the top; the largest by default. */
  max?: number;
  /** The gap between groups in pixels; 2 by default, so the groups read as one run parted by hairlines. */
  gap?: number;
  /** The tooltip's text for a value. The number by default. */
  format?: (value: number, group: number, index: number) => string;
  /** A name for assistive technology: "Searches by hour, this week". */
  'aria-label'?: string;
  className?: string;
}

const DEFAULT_COLOR = 'var(--lv6)';
const HEAD = 30;
const BAND = 10;
const FOOT = 20;

export function GroupedBars({ groups, labels, height = 120, max, gap = 2, format, 'aria-label': ariaLabel, className = '' }: GroupedBarsProps) {
  const GROUP_GAP = gap;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<[number, number] | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = groups.reduce((a, g) => a + g.values.length, 0);
  const top = max ?? groups.reduce((a, g) => g.values.reduce((b, v) => (Number.isFinite(v) && v > b ? v : b), a), 0);
  const total = height + HEAD + 4 + BAND + FOOT;
  const barsTop = HEAD;
  const barsBottom = HEAD + height;
  const pitch = n > 0 ? (width - GROUP_GAP * Math.max(0, groups.length - 1)) / n : 0;
  // Where each group starts, in pixels.
  const starts: number[] = [];
  let x = 0;
  for (const g of groups) {
    starts.push(x);
    x += g.values.length * pitch + GROUP_GAP;
  }
  const barX = (gi: number, i: number) => starts[gi] + i * pitch + pitch / 2;
  const colorOf = (g: BarGroup) => (g.highlight ? g.color ?? 'var(--CTeal)' : DEFAULT_COLOR);
  // Sample labels every so many, so they stay at least 28px apart; the first and the last kept
  // inside the width.
  const every = pitch > 0 ? Math.max(1, Math.ceil(28 / pitch)) : 1;
  const tickX = (gi: number, i: number) => Math.min(width - 10, Math.max(10, barX(gi, i)));

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!format || n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const from = starts[gi], to = from + g.values.length * pitch;
      if (px >= from - GROUP_GAP / 2 && px < to + GROUP_GAP / 2) {
        const i = Math.min(g.values.length - 1, Math.max(0, Math.floor((px - from) / pitch)));
        setHover([gi, i]);
        return;
      }
    }
    setHover(null);
  };

  const tip = hover && format ? (() => {
    const [gi, i] = hover;
    const g = groups[gi];
    const tx = barX(gi, i);
    const left = tx > width / 2;
    // Beside the bar's top, to the right or the left past the middle, never above the chart.
    const h = top > 0 && Number.isFinite(g.values[i]) ? (Math.max(0, g.values[i]) / top) * height : 0;
    return (
      <div className={`${styles.tooltip} ${left ? styles.tooltipLeft : ''}`} style={{ left: left ? tx - 8 : tx + 8, top: Math.max(barsTop + 12, barsBottom - h) }}>
        <span className={styles.tooltipLabel}>{g.label}{labels?.[i] != null ? ` · ${labels[i]}` : ''}</span>
        <span className={styles.tooltipValue}>{format(g.values[i], gi, i)}</span>
      </div>
    );
  })() : null;

  return (
    <div ref={ref} className={`${styles.chart} ${className}`} style={{ height: total } as CSSProperties} onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg className={styles.svg} width={width} height={total} role="img" aria-label={ariaLabel} onPointerMove={onPointerMove} onPointerDown={onPointerMove}>
          {groups.map((g, gi) => {
            const from = starts[gi];
            const span = g.values.length * pitch;
            const color = colorOf(g);
            return (
              <g key={gi}>
                <line className={styles.divider} x1={from} y1={0} x2={from} y2={barsBottom} />
                <text className={styles.head} x={from + 6} y={11}>{g.label}</text>
                {g.sublabel != null && (
                  <text className={`${styles.sub} ${g.highlight ? styles.subHighlight : ''}`} x={from + 6} y={23} style={g.highlight ? { fill: color } : undefined}>
                    {g.sublabel}
                  </text>
                )}
                {g.values.map((v, i) => {
                  const h = top > 0 && Number.isFinite(v) ? (Math.max(0, v) / top) * height : 0;
                  const hovered = hover?.[0] === gi && hover[1] === i;
                  return (
                    <rect
                      key={i}
                      className={hovered ? styles.barHovered : styles.bar}
                      style={{ fill: hovered ? undefined : color }}
                      x={barX(gi, i) - (hovered ? 1.5 : 1)}
                      y={barsBottom - h}
                      width={hovered ? 3 : 2}
                      height={h}
                    />
                  );
                })}
                <rect className={styles.band} style={g.highlight ? { fill: color } : undefined} x={from} y={barsBottom + 4} width={span} height={BAND} />
                {labels && g.values.map((_, i) => (i % every === 0 ? (
                  <text key={`l${i}`} className={styles.tick} x={tickX(gi, i)} y={total - 5} textAnchor="middle">{labels[i]}</text>
                ) : null))}
              </g>
            );
          })}
        </svg>
      )}
      {tip}
    </div>
  );
}
