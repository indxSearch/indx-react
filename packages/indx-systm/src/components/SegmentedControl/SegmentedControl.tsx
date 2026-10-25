import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import styles from './SegmentedControl.module.css';

// One choice from a few, side by side: the chosen cell filled like a primary Button, the rest
// on the faint surface tone, touching: the button Tabs look with no gap, without the navigation.
// For the period of a chart, the interval of a graph, the type of a view: a compact control for
// a panel's header, where Tabs would be too tall and a Select hides the options. A cell is a
// word or an icon; the icon-only cell takes an aria-label. Arrow keys move between cells.

export interface SegmentedItem<T extends string = string> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
  /** The cell's name when it is only an icon. */
  'aria-label'?: string;
  disabled?: boolean;
}

export type SegmentedSize = 'micro' | 'default';

export interface SegmentedControlProps<T extends string = string> {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 'micro' is 24px tall, for a panel header; 'default' 30px, the height of a micro Tab. */
  size?: SegmentedSize;
  /** Cells share the width equally instead of taking their content's. */
  stretch?: boolean;
  disabled?: boolean;
  /** What the choice is: "Period". */
  'aria-label'?: string;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  items,
  value,
  onChange,
  size = 'micro',
  stretch = false,
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  const cells = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrows move to the next enabled cell and choose it, wrapping; Home and End to the ends.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, from: number) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    let to = -1;
    if (dir) {
      for (let step = 1; step <= items.length; step++) {
        const i = (from + dir * step + items.length) % items.length;
        if (!items[i].disabled) { to = i; break; }
      }
    } else if (e.key === 'Home') to = items.findIndex((it) => !it.disabled);
    else if (e.key === 'End') to = items.length - 1 - [...items].reverse().findIndex((it) => !it.disabled);
    if (to < 0 || to === from) return;
    e.preventDefault();
    cells.current[to]?.focus();
    onChange(items[to].value);
  };

  return (
    <div
      className={`${styles.control} ${styles[size]} ${stretch ? styles.stretch : ''} ${disabled ? styles.disabled : ''} ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        const off = disabled || item.disabled;
        return (
          <button
            key={item.value}
            ref={(el) => { cells.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={item['aria-label']}
            className={`${styles.cell} ${active ? styles.active : ''} ${item.icon && !item.label ? styles.iconOnly : ''}`}
            tabIndex={active ? 0 : -1}
            disabled={off}
            onClick={() => !off && onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
