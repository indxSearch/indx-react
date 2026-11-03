import type { CSSProperties } from 'react';
import styles from './StepProgress.module.css';

// Progress through steps in parts: one thin bar per part, side by side with a gap, each as wide
// as its share of the steps and filled by how many of its own are done. Progress within progress:
// the row says how far along the whole is, each bar how far along its part. A part of one step is
// a plain stepper (the first-run setup's "two more steps"). Where ProgressBar is one quantity on
// its way to done and BarMeter a level that goes up and down, this is a checklist's state.
// The Blazor StepProgress is its port.

export interface StepProgressPart {
  /** The part's name, shown under its bar with `labels`. */
  label?: string;
  /** Steps of the part done. */
  value: number;
  /** Steps in the part; 1 by default, a plain stepper's step. */
  max?: number;
}

export interface StepProgressProps {
  parts: StepProgressPart[];
  /** Each bar as wide as its share of all the steps (default), or all as wide. */
  weighted?: boolean;
  /** The part names and their counts under the bars. */
  labels?: boolean;
  /** The filled colour; the ink by default. */
  color?: string;
  /** The bars' height in pixels; 3 by default. */
  height?: number;
  'aria-label'?: string;
  className?: string;
}

export function StepProgress({ parts, weighted = true, labels = false, color, height = 3, className = '', ...rest }: StepProgressProps) {
  const done = parts.reduce((n, p) => n + Math.min(p.value, p.max ?? 1), 0);
  const total = parts.reduce((n, p) => n + (p.max ?? 1), 0);
  const style = { '--step-fill': color, '--step-height': `${height}px` } as CSSProperties;
  return (
    <div className={`${styles.steps} ${className}`} style={style} role="progressbar" aria-valuemin={0} aria-valuemax={total}
         aria-valuenow={done} aria-label={rest['aria-label'] ?? `${done} of ${total} done`}>
      {parts.map((p, i) => {
        const max = p.max ?? 1, value = Math.min(Math.max(p.value, 0), max);
        return (
          <div key={i} className={styles.part} style={{ flex: weighted ? max : 1 }}>
            <div className={styles.track}><div className={styles.fill} style={{ width: `${(value / max) * 100}%` }} /></div>
            {labels && (
              <div className={styles.label}>
                <span className={styles.name}>{p.label}</span>
                <span className={styles.count}>{value}/{max}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
