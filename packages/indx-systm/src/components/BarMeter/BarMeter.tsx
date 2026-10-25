import type { CSSProperties, ReactNode } from 'react';
import styles from './BarMeter.module.css';

// A quantity against its ceiling, as a row of bars: the filled ones in the ink, the rest dim. A
// label above, the value at the left below and the ceiling at the right. Where ProgressBar is a
// percentage on its way to done, BarMeter is a level that goes up and down: CPU pressure, memory
// in use, a quota. The bars are drawn by a repeating gradient, so their number follows the width.

export interface BarMeterProps {
  /** What is measured: "CPU pressure", "Memory". */
  label: ReactNode;
  value: number;
  max: number;
  /** The value as shown at the left; defaults to the number itself. */
  format?: (value: number) => ReactNode;
  /** The ceiling as shown at the right; defaults to "of" and the formatted max. */
  maxLabel?: ReactNode;
  /** The filled bars' colour, for a level that has become a problem: the signal red past a threshold. */
  color?: string;
  className?: string;
}

export function BarMeter({ label, value, max, format, maxLabel, color, className = '' }: BarMeterProps) {
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const show = (n: number) => (format ? format(n) : n.toLocaleString());
  return (
    <div
      className={`${styles.meter} ${className}`}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.bars} aria-hidden="true">
        <div
          className={styles.fill}
          style={{ '--meter-fill': `${fraction * 100}%`, color } as CSSProperties}
        />
      </div>
      <div className={styles.foot} aria-hidden="true">
        <span className={styles.value}>{show(value)}</span>
        <span className={styles.max}>{maxLabel ?? <>of {show(max)}</>}</span>
      </div>
    </div>
  );
}
