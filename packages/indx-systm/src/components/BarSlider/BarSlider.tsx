import styles from './BarSlider.module.css';
import React from 'react';
import { Range } from 'react-range';

// A slider that is its own row. The fill runs from the left edge to the value and spans the
// full height, the label sits inside at the left, the value at the right, and the handle is a
// thin line at the fill's edge. Where Slider is a track under a label, BarSlider is a field:
// it lines up with buttons and inputs of the same size, so a stack of settings reads as one
// column (weight, slant, size…).

const MAX_STEP_MARKS = 50;
// The handle's centre sits this far inside the fill's end, so the fill's edge marks the value and
// the handle stands on the fill.
const HANDLE_OFFSET = 6;
// At the low end the handle stays this far from the row's left edge, inside the padding, where no
// fill reaches it: a slider at its minimum still shows where its handle is.
const HANDLE_INSET = 8;

export type BarSliderSize = 'micro' | 'default';

export interface BarSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  onFinalChange?: (value: number) => void;
  /** Shown inside the bar, at the left. */
  label?: string;
  /** The value as shown at the right; defaults to the number itself. */
  format?: (value: number) => React.ReactNode;
  /** Hide the value at the right. */
  showValue?: boolean;
  /** A dot at every step, on the part of the track the fill has not reached. */
  stepMarks?: boolean;
  disabled?: boolean;
  /** 'default' is 40px like a default Button, 'micro' is 30px. */
  size?: BarSliderSize;
  className?: string;
  'aria-label'?: string;
  id?: string;
}

export const BarSlider: React.FC<BarSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  onFinalChange,
  label,
  format,
  showValue = true,
  stepMarks = false,
  disabled = false,
  size = 'default',
  className,
  'aria-label': ariaLabel,
  id,
}) => {
  const generatedId = React.useId();
  const sliderId = id || generatedId;
  // The focus ring shows only after the keyboard reached the handle. react-range focuses the handle
  // from script on a drag, which the browser's :focus-visible can count as keyboard focus.
  const [keyboardFocus, setKeyboardFocus] = React.useState(false);

  if (import.meta.env.DEV && !label && !ariaLabel) {
    console.warn('BarSlider: Component should have either a label or aria-label for accessibility.');
  }

  const hasValidRange = Number.isFinite(min) && Number.isFinite(max) && max > min;
  const rowClassName = [styles.row, styles[size], disabled ? styles.disabled : '', keyboardFocus ? styles.keyboardFocus : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  if (!hasValidRange) {
    if (import.meta.env.DEV) {
      console.warn('BarSlider: max must be greater than min. Rendering a disabled bar.');
    }
    return (
      <div className={`${rowClassName} ${styles.disabled}`} aria-hidden="true">
        {label && <span className={styles.label}>{label}</span>}
      </div>
    );
  }

  const span = max - min;
  const clamped = Math.min(max, Math.max(min, value));
  const fillPct = ((clamped - min) / span) * 100;

  // One dot per step, ends included. Past MAX_STEP_MARKS they would merge into a line, so a
  // fine-grained slider draws none.
  const stepCount = step > 0 ? Math.round(span / step) : 0;
  const showStepMarks = stepMarks && stepCount > 0 && stepCount <= MAX_STEP_MARKS;
  const lineLeft = `max(${HANDLE_INSET}px, calc(${fillPct}% - ${HANDLE_OFFSET}px))`;

  return (
    <Range
      step={step}
      min={min}
      max={max}
      values={[clamped]}
      onChange={(vals) => onChange(vals[0])}
      onFinalChange={(vals) => onFinalChange?.(vals[0])}
      disabled={disabled}
      renderTrack={({ props: trackProps, children }) => {
        const { key, ...restTrackProps } = trackProps as any;
        return (
          <div
            key={key}
            {...restTrackProps}
            className={rowClassName}
            style={restTrackProps.style}
            onMouseDown={(e: React.MouseEvent) => { setKeyboardFocus(false); restTrackProps.onMouseDown?.(e); }}
            onTouchStart={(e: React.TouchEvent) => { setKeyboardFocus(false); restTrackProps.onTouchStart?.(e); }}
          >
            {/* The fill is a full-width overlay in the ink, text and handle in the inverted ink,
                clipped at the value, so the text and the handle turn light as the fill reaches
                them. The row holds the same text and handle in the ink underneath. */}
            <span className={styles.line} style={{ left: lineLeft }} aria-hidden="true" />
            <div className={styles.fill} style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }} aria-hidden="true">
              {label && <span className={styles.label}>{label}</span>}
              {showValue && <span className={styles.value}>{format ? format(clamped) : clamped}</span>}
              <span className={styles.line} style={{ left: lineLeft }} />
            </div>
            {showStepMarks && (
              <div className={styles.stepmarks} aria-hidden="true">
                {Array.from({ length: stepCount + 1 }, (_, i) => (
                  <span
                    key={i}
                    className={styles.stepmark}
                    style={{ left: `${(Math.min(i * step, span) / span) * 100}%` }}
                  />
                ))}
              </div>
            )}
            {label && (
              <label htmlFor={sliderId} className={styles.label}>
                {label}
              </label>
            )}
            {showValue && <span className={styles.value}>{format ? format(clamped) : clamped}</span>}
            {children /* the handle */}
          </div>
        );
      }}
      renderThumb={({ props: thumbProps }) => {
        const { key, ...restThumbProps } = thumbProps as any;
        return (
          <div
            key={key}
            {...restThumbProps}
            id={sliderId}
            className={styles.handle}
            // react-range writes z-index: 0 inline, which would put the handle under the fill.
            style={{ ...restThumbProps.style, zIndex: 3 }}
            onKeyDown={(e: React.KeyboardEvent) => { setKeyboardFocus(true); restThumbProps.onKeyDown?.(e); }}
            onBlur={() => setKeyboardFocus(false)}
            aria-label={ariaLabel || label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clamped}
          />
        );
      }}
    />
  );
};
