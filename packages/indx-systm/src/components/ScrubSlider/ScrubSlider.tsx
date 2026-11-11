import styles from './ScrubSlider.module.css';
import React from 'react';
import { InputField } from '../InputField/InputField';

// A slider with no end. A ruler of ticks scrolls under a fixed handle in the middle and moves with
// the hand: dragging it right brings lower values under the handle, left higher ones, one step per
// tick, as far as the drag goes, and the number
// field at the right shows and takes the value. For a quantity with no natural range (a
// threshold, an offset, a count), where a bar from min to max would have to invent one.

// Pixels of drag per step. Every fifth tick is a major one.
const TICK_SPACING = 8;
const MAJOR_EVERY = 5;

/** A value marked on the ruler: a line where it stands, scrolling with the ticks. A tone colours it,
 *  for a value that changes what the setting does (0 switching a weight off). */
export interface ScrubSliderMark {
  value: number;
  tone?: 'warning' | 'signal';
  /** What the mark means, read by a screen reader with the slider's value text. */
  label?: string;
}

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
  /** Values marked on the ruler. */
  marks?: ScrubSliderMark[];
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
  marks,
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

  // The drag: where it started, in pixels and in value. The moves and the release are read on the
  // window from the press itself, so letting go anywhere ends the drag, and the ruler takes
  // pointer capture too so the moves keep coming past the window's edge: that is what makes the
  // slider endless. The listeners are attached in the press, not in an effect, so a release that
  // comes before the next render is still seen.
  const drag = React.useRef<{ x: number; value: number; moved: boolean; stop: () => void } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  // The focus line shows only once the keyboard has reached the ruler; a press focuses it too,
  // for the arrow keys, but should not light it.
  const [keyboardFocus, setKeyboardFocus] = React.useState(false);
  const latest = React.useRef({ value, onChange, onFinalChange, clamp, step });
  latest.current = { value, onChange, onFinalChange, clamp, step };

  React.useEffect(() => () => drag.current?.stop(), []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    setKeyboardFocus(false);
    drag.current?.stop();
    const target = e.currentTarget;
    const pointerId = e.pointerId;
    try { target.setPointerCapture(pointerId); } catch { /* not every pointer can be captured */ }

    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const { value, onChange, clamp, step } = latest.current;
      // The ruler moves with the hand, as a tape does: dragging right pulls the lower values in
      // under the handle. Until Nov 2026 a drag right raised the value, which slid the ticks left,
      // against the finger. The arrow keys keep Right for up, as on any slider.
      const ticks = Math.round((ev.clientX - d.x) / TICK_SPACING);
      const next = clamp(d.value - ticks * step);
      if (ticks !== 0) d.moved = true;
      if (next !== value) onChange(next);
    };
    const stop = () => {
      const d = drag.current;
      drag.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
      try { if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId); } catch { /* gone */ }
      setDragging(false);
      if (d?.moved) latest.current.onFinalChange?.(latest.current.value);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);

    drag.current = { x: e.clientX, value, moved: false, stop };
    setDragging(true);
    target.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    setKeyboardFocus(true);
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
  // With a bound, the ticks stop where it is: the bound sits this many pixels from the middle,
  // and the ticks beyond it are clipped away, so the ruler visibly ends there.
  const toPx = (bound: number) => ((bound - value) / step) * TICK_SPACING;
  const clipLeft = typeof min === 'number' ? `max(0px, calc(50% + ${toPx(min)}px))` : '0px';
  const clipRight = typeof max === 'number' ? `max(0px, calc(50% - ${toPx(max)}px))` : '0px';
  const rulerStyle = {
    '--scrub-shift': `${shift}px`,
    '--scrub-tick': `${TICK_SPACING}px`,
    '--scrub-period': `${period}px`,
    '--scrub-clip': `inset(0 ${clipRight} 0 ${clipLeft})`,
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
        className={`${styles.ruler} ${dragging ? styles.dragging : ''} ${keyboardFocus ? styles.keyboardFocus : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-resize-ew'}`}
        style={rulerStyle}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || label}
        aria-valuenow={value}
        aria-valuetext={marks?.find((m) => m.value === value)?.label ? `${value}, ${marks.find((m) => m.value === value)!.label}` : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-disabled={disabled || undefined}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onBlur={() => setKeyboardFocus(false)}
      >
        <div className={styles.ticks} aria-hidden="true" />
        {marks?.map((m) => (
          <div
            key={m.value}
            className={`${styles.mark} ${m.tone === 'warning' ? styles.markWarning : m.tone === 'signal' ? styles.markSignal : ''}`}
            style={{ left: `calc(50% + ${toPx(m.value)}px)` }}
            aria-hidden="true"
          />
        ))}
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
