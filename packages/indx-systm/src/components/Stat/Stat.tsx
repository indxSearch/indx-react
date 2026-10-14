import type { CSSProperties, ReactNode } from 'react';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Stat.module.css';

export interface StatProps {
  /** What the number is: "Searches", "Click-through". */
  label: ReactNode;
  /** The number, formatted; or a chip, for a state. */
  value: ReactNode;
  /** Shown on the label, which gets a dotted underline to say there is more. */
  hint?: string;
  /** A line under the value: a change against the previous period, a unit, a note. */
  children?: ReactNode;
  className?: string;
}

/** One number with its label, on the Base surface: a KPI, a count, a state. Put several in a StatGroup. */
export function Stat({ label, value, hint, children, className = '' }: StatProps) {
  const labelEl = <span className={`${styles.label} ${hint ? styles.hinted : ''}`}>{label}</span>;
  return (
    <div className={`${styles.stat} ${className}`}>
      {hint ? <Tooltip content={hint}>{labelEl}</Tooltip> : labelEl}
      <span className={styles.value}>{value}</span>
      {children != null && <span className={styles.foot}>{children}</span>}
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
