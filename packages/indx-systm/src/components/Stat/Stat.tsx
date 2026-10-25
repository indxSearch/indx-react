import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Stat.module.css';

/**
 * The pixl grid is 7 cells by 5, so an icon is crisp at a width that is a multiple of 7: 14, 21,
 * 28, 35. The value is set at 24px; 28 wide (20 tall) sits on its cap height.
 */
export const STAT_ICON_SIZE = 28;

export interface StatProps {
  /** What the number is: "Searches", "Click-through". */
  label: ReactNode;
  /** The number, formatted; or a chip, for a state. Left out when the figure carries it. */
  value?: ReactNode;
  /** A graphic under the label, the value and foot beside it: a BarMeter ring with the number in it. */
  figure?: ReactNode;
  /** A pixl icon before the value, for a state ("Up", "Key set"): drawn at STAT_ICON_SIZE in the value's colour. */
  icon?: ReactElement<{ size?: number | string; color?: string }>;
  /** The value's colour, and the icon's: the signal red for a state that is wrong. A good state stays in the ink; the icon says it. */
  color?: string;
  /** Shown on the label, which gets a dotted underline to say there is more. */
  hint?: string;
  /** A line under the value: a change against the previous period, a unit, a note. */
  children?: ReactNode;
  className?: string;
}

/** One number with its label, on the Base surface: a KPI, a count, a state. Put several in a StatGroup. */
export function Stat({ label, value, figure, icon, color, hint, children, className = '' }: StatProps) {
  const labelEl = <span className={`${styles.label} ${hint ? styles.hinted : ''}`}>{label}</span>;
  const iconEl = icon && isValidElement(icon)
    ? cloneElement(icon, { size: icon.props.size ?? STAT_ICON_SIZE, color: icon.props.color ?? 'currentColor' })
    : icon;
  const labelled = hint ? <Tooltip content={hint}>{labelEl}</Tooltip> : labelEl;
  const valueEl = (value != null || iconEl != null) && (
    <span className={styles.value} style={color ? { color } : undefined}>
      {iconEl != null && <span className={styles.icon} aria-hidden="true">{iconEl}</span>}
      {value}
    </span>
  );
  const footEl = children != null && <span className={styles.foot}>{children}</span>;
  // With a figure the label stays on top, where every tile has it; the figure sits under it
  // with the value and foot beside.
  if (figure != null) {
    return (
      <div className={`${styles.stat} ${className}`}>
        {labelled}
        <span className={styles.figured}>
          <span className={styles.figure}>{figure}</span>
          <span className={styles.text}>
            {valueEl}
            {footEl}
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className={`${styles.stat} ${className}`}>
      {labelled}
      {valueEl}
      {footEl}
    </div>
  );
}

export interface StatGroupProps {
  children: ReactNode;
  /**
   * How many across on a wide screen. Without it, as many as fit at 180px each. With it, more
   * than three step down to three under 1100px, and anything to two on a phone, where a last odd
   * one spans the row.
   */
  columns?: number;
  className?: string;
}

export function StatGroup({ children, columns, className = '' }: StatGroupProps) {
  const fixed = columns ? `${styles.fixed} ${columns > 3 ? styles.many : ''} ${columns > 2 ? styles.pairs : ''}` : '';
  return (
    <div className={`${styles.group} ${fixed} ${className}`} style={columns ? ({ '--stat-columns': columns } as CSSProperties) : undefined}>
      {children}
    </div>
  );
}
