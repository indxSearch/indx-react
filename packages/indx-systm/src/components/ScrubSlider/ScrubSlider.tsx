import styles from './ScrubSlider.module.css';
import React from 'react';
import { InputField } from '../InputField/InputField';

// A slider with no end. A ruler of ticks scrolls under a fixed handle in the middle: dragging it
// left or right moves the value by one step per tick, as far as the drag goes, and the number
// field at the right shows and takes the value. For a quantity with no natural range (a
// threshold, an offset, a count), where a bar from min to max would have to invent one.

// Pixels of drag per step. Every fifth tick is a major one.
const TICK_SPACING = 8;
const MAJOR_EVERY = 5;

export interface ScrubSliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Called when a drag ends or the field commits. */
  onFinalChange?: (value: number) => void;
  /** The value moves by this per tick (and per arrow key); Shift moves ten. */
  step?: number;
  /** Bounds are optional: without them the slider has no end. */
  min?: number;
  max?: number;
  /** Shown at the left, outside the ruler. */
  label?: string;
  /** A fixed width for the label, as CSS, so a stack of sliders lines up its rulers. */
  labelWidth?: string;
  disabled?: boolean;
  /** Width of the number field, as CSS; 70px by default. */
  fieldWidth?: string;
  className?: string;
  'aria-label'?: string;
  id?: string;
}

export const ScrubSlider: React.FC<ScrubSliderProps> = ({
  value,
  onChange,
  onFinalChange,
  step = 1,
  min,
  max,
  label,
  labelWidth,
  disabled = false,
  fieldWidth = '70px',
  className,
  'aria-label': ariaLabel,
  id,
}) => {
  const generatedId = React.useId();
  const fieldId = id || generatedId;

  if (import.meta.env.DEV && !label && !ariaLabel) {
    console.warn('ScrubSlider: Component should have either a label or aria-label for accessibility.');
  }

  const decimals = React.useMemo(() => {
    const s = String(step);
    const i = s.indexOf('.');
    return i < 0 ? 0 : s.length - i - 1;
  }, [step]);

  const clamp = React.useCallback(
    (v: number) => {
      let r = v;
      if (typeof min === 'number') r = Math.max(min, r);
      if (typeof max === 'number') r = Math.min(max, r);
      return Number(r.toFixed(decimals));
    },
    [min, max, decimals],
  );

  // The drag: where it started, in pixels and in value. Pointer capture keeps the moves coming
  // past the ruler's edges and the window's, which is what makes the slider endless.
  const drag = React.useRef<{ x: number; value: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, value, moved: false };
    setDragging(true);
    e.currentTarget.focus();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const ticks = Math.round((e.clientX - d.x) / TICK_SPACING);
    const next = clamp(d.value + ticks * step);
    if (ticks !== 0) d.moved = true;
    if (next !== value) onChange(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d.moved) onFinalChange?.(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = e.shiftKey ? 10 : 1;
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clamp(value + step * big);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clamp(value - step * big);
    else if (e.key === 'Home' && typeof min === 'number') next = min;
    else if (e.key === 'End' && typeof max === 'number') next = max;
    if (next === undefined) return;
    e.preventDefault();
    if (next !== value) {
      onChange(next);
      onFinalChange?.(next);
    }
  };

  // The field: free text while it has focus, committed on blur or Enter, so a half-typed number
  // never snaps under the cursor.
  const [text, setText] = React.useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const parsed = Number(text.replace(',', '.'));
    setText(null);
    if (text.trim() === '' || !Number.isFinite(parsed)) return;
    const next = clamp(parsed);
    if (next !== value) {
      onChange(next);
      onFinalChange?.(next);
    }
  };

  // The ticks are two repeating gradients, phased by the value so they scroll under the handle.
  // The phase is taken modulo a major period, so the number stays small however far the value goes.
  const period = TICK_SPACING * MAJOR_EVERY;
  const shift = -(((value / step) * TICK_SPACING) % period);
  const rulerStyle = {
    '--scrub-shift': `${shift}px`,
    '--scrub-tick': `${TICK_SPACING}px`,
    '--scrub-period': `${period}px`,
  } as React.CSSProperties;

  const rowClassName = [styles.row, disabled ? styles.disabled : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rowClassName}>
      {label && (
        <label htmlFor={fieldId} className={styles.label} style={labelWidth ? { width: labelWidth } : undefined}>
          {label}
        </label>
      )}
      <div
        className={`${styles.ruler} ${dragging ? styles.dragging : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-resize-ew'}`}
        style={rulerStyle}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-disabled={disabled || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <div className={styles.ticks} aria-hidden="true" />
        <div className={styles.handle} aria-hidden="true" />
      </div>
      <InputField
        id={fieldId}
        className={styles.field}
        style={{ width: fieldWidth }}
        type="text"
        inputMode="decimal"
        aria-label={label ? `${label}, value` : ariaLabel}
        value={text ?? String(value)}
        disabled={disabled}
        onFocus={() => setText(String(value))}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          if (e.key === 'Escape') setText(null);
        }}
      />
    </div>
  );
};
