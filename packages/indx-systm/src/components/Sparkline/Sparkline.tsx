import React from 'react';
import styles from './Sparkline.module.css';

/**
 * A tiny display-only graph: a shape the size of a line of text, for putting a trend next to a
 * number. Searches over the last hours, documents added per day, that sort of thing.
 *
 * Deliberately NOT a mode of `Chart`. Chart is mostly chrome -- a legend, axis labels, hover
 * state, a tooltip, padding that changes with the labels -- and a sparkline must have none of it,
 * so a mode would be a list of props switching things off and a set of branches Chart then has to
 * carry. More to the point, Chart is interactive and this is not: no state, no listeners, nothing
 * to clean up. That matters where these are used, which is many at once on a list of cards.
 *
 * If you want an axis, a legend or a tooltip, you want Chart.
 */
export interface SparklineProps {
  /** The values, oldest first. Fewer than two renders the baseline alone. */
  values: number[];
  type?: 'line' | 'bar';
  /** CSS width. Defaults to filling the space it is given. */
  width?: number | string;
  height?: number;
  /** Any CSS colour. Defaults to the text colour, so it inherits whatever it sits in. */
  color?: string;
  /** Line only: fill the area under the curve, at low opacity. */
  fill?: boolean;
  /** A hairline at the bottom, for when the shape alone does not read as a graph. */
  baseline?: boolean;
  /** Bar only: the gap between bars, in real pixels whatever the width. */
  gap?: number;
  /**
   * What the graph says, for anyone who cannot see it. A sparkline with no label is invisible to
   * a screen reader; with one it is an image with a description.
   */
  ariaLabel?: string;
  className?: string;
}

/** The viewBox is fixed and the SVG scales to its box, so nothing has to measure the DOM. */
const VB_W = 100;
const VB_H = 100;

export function Sparkline({
  values,
  type = 'line',
  width = '100%',
  height = 24,
  color = 'currentColor',
  fill = false,
  baseline = false,
  gap = 1,
  ariaLabel,
  className,
}: SparklineProps) {
  const clean = values.filter((v) => Number.isFinite(v));
  const hidden = ariaLabel == null;

  // A flat series still draws: without this, max === min divides by zero and the shape vanishes.
  const max = clean.length ? Math.max(...clean) : 0;
  const min = clean.length ? Math.min(...clean) : 0;
  const span = max - min || 1;

  // Inset by half a stroke so the extremes are not clipped by the viewBox edge.
  const inset = 6;
  const plotH = VB_H - inset * 2;
  const y = (v: number) => inset + plotH - ((v - min) / span) * plotH;

  const svg = (children: React.ReactNode) => (
    <svg
      className={[styles.sparkline, className].filter(Boolean).join(' ')}
      style={{ width, height, color }}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      role={hidden ? undefined : 'img'}
      aria-label={ariaLabel}
      aria-hidden={hidden || undefined}
      focusable="false"
    >
      {children}
      {baseline && (
        <line
          x1="0"
          y1={VB_H - 0.5}
          x2={VB_W}
          y2={VB_H - 0.5}
          className={styles.baseline}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );

  if (clean.length < 2) return svg(null);

  // Bars are laid out with CSS rather than drawn in the SVG. The viewBox stretches to the box
  // (preserveAspectRatio="none"), so a gap expressed in viewBox units lands at a different pixel
  // width for every size and every number of bars. A flex row's gap is the pixels you asked for.
  if (type === 'bar') {
    return (
      <div
        className={[styles.bars, className].filter(Boolean).join(' ')}
        style={{ width, height, color, gap, borderBottomWidth: baseline ? 1 : 0 }}
        role={hidden ? undefined : 'img'}
        aria-label={ariaLabel}
        aria-hidden={hidden || undefined}
      >
        {clean.map((v, i) => (
          <span
            key={i}
            className={styles.bar}
            // A flat series is every bar at full height rather than every bar at nothing, which is
            // the same choice the line makes when max equals min.
            style={{ height: `${Math.max(((v - min) / span) * 100, 2)}%` }}
          />
        ))}
      </div>
    );
  }

  const step = VB_W / (clean.length - 1);
  const points = clean.map((v, i) => `${i * step},${y(v)}`).join(' ');

  return svg(
    <>
      {fill && (
        <polygon className={styles.fill} points={`0,${VB_H} ${points} ${VB_W},${VB_H}`} />
      )}
      {/* non-scaling-stroke: preserveAspectRatio="none" stretches the viewBox, which would
          otherwise stretch the stroke with it and give a line thicker one way than the other. */}
      <polyline className={styles.line} points={points} vectorEffect="non-scaling-stroke" />
    </>
  );
}
