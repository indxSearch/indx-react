// packages/systm/src/components/Slider.tsx
import styles from './Slider.module.css';
import React from 'react';
import { Range } from 'react-range';

type SingleValue = number;

const MAX_STEP_MARKS = 50;

// 'inline' draws the bars across the track and takes no extra height;
// 'below' draws them in a row 10px under the track and reserves room for it.
export type StepMarks = 'inline' | 'below';
type RangeValue = [number, number];

interface BaseSliderProps {
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  className?: string;    // optional wrapper class
  activeMin?: number;    // live-range lower bound
  activeMax?: number;    // live-range upper bound
  isFaceted?: boolean;   // whether the range has been faceted
  highlightFaceted?: boolean;
  stepMarks?: StepMarks; // draw a bar at every step: on the track, or in a row below it
  onChange: (val: SingleValue | RangeValue) => void;
  onFinalChange?: (val: SingleValue | RangeValue) => void;
  label?: string;
  'aria-label'?: string;
  id?: string;
}

type SliderProps =
  | (BaseSliderProps & { value: SingleValue; isRange?: false })
  | (BaseSliderProps & { value: RangeValue; isRange: true; isFaceted?: boolean });

export const Slider: React.FC<SliderProps> = (props) => {
  const {
    min,
    max,
    step = 1,
    disabled = false,
    className,
    activeMin,
    activeMax,
    isFaceted = false,
    highlightFaceted = true,
    stepMarks,
    onChange,
    onFinalChange,
    label,
    'aria-label': ariaLabel,
    id,
  } = props as BaseSliderProps;

  const generatedId = React.useId();
  const sliderId = id || generatedId;

  // Warn in development if there's no label or aria-label
  if (import.meta.env.DEV) {
    if (!label && !ariaLabel) {
      console.warn('Slider: Component should have either a label or aria-label for accessibility.');
    }
  }

  const hasValidRange = Number.isFinite(min) && Number.isFinite(max) && max > min;

  if (!hasValidRange) {
    if (import.meta.env.DEV) {
      console.warn('Slider: max must be greater than min. Rendering a disabled track.');
    }

    return (
      <div className={className}>
        {label && <span className={styles.label}>{label}</span>}
        <div className={`${styles.basetrack} ${styles.disabled}`} aria-hidden="true" />
      </div>
    );
  }

  // One bar per step, ends included. Past MAX_STEP_MARKS they would merge into a solid band,
  // so a fine-grained slider draws none rather than a smear.
  const stepCount = step > 0 ? Math.round((max - min) / step) : 0;
  const showStepMarks = !!stepMarks && stepCount > 0 && stepCount <= MAX_STEP_MARKS;
  const trackClassName = showStepMarks && stepMarks === 'below'
    ? `${styles.basetrack} ${styles.basetrackStepsBelow}`
    : styles.basetrack;
  const stepMarkRow =
    showStepMarks ? (
      <div
        className={`${styles.stepmarks} ${stepMarks === 'below' ? styles.stepmarksBelow : styles.stepmarksInline}`}
        aria-hidden="true"
      >
        {Array.from({ length: stepCount + 1 }, (_, i) => (
          <span
            key={i}
            className={styles.stepmark}
            style={{ left: `${(Math.min(i * step, max - min) / (max - min)) * 100}%` }}
          />
        ))}
      </div>
    ) : null;

  if ('isRange' in props && props.isRange) {
    // ─────────── Two-thumb "range" mode ───────────
    const valuePair = props.value as RangeValue;
    const [v0, v1] = valuePair;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={sliderId} className={styles.label}>
            {label}
          </label>
        )}
        <Range
          step={step}
          min={min}
          max={max}
          values={valuePair}
          onChange={(vals) => onChange(vals as RangeValue)}
          onFinalChange={(vals) => onFinalChange?.(vals as RangeValue)}
          disabled={disabled}
          renderTrack={({ props: trackProps, children }) => {
            // pull key off trackProps so we don't spread it
            const { key, ...restTrackProps } = (trackProps as any);

            // Compute percentages for the "selected" segment (between thumbs)
            // and for the "live" overlay (activeMin to activeMax).
            const span = max - min;
            const selectedLeftPct = ((v0 - min) / span) * 100;
            const selectedWidthPct = ((v1 - v0) / span) * 100;

            let liveLeftPct = 0;
            let liveWidthPct = 0;
            const hasLiveOverlay =
              typeof activeMin === 'number' &&
              typeof activeMax === 'number' &&
              activeMax > activeMin &&
              (activeMin > min || activeMax < max);

            if (hasLiveOverlay) {
              liveLeftPct = ((activeMin! - min) / span) * 100;
              liveWidthPct = ((activeMax! - activeMin!) / span) * 100;
            }

            return (
              <div
                key={key}
                {...restTrackProps}
                className={trackClassName}
                style={{
                  ...restTrackProps.style,
                }}
              >
                {/* ─── Selected-range track (hidden when active range shown) ─── */}
                {!hasLiveOverlay && (
                  <div
                    className={styles.selectedtrack}
                    style={{
                      left: `${selectedLeftPct}%`,
                      width: `${selectedWidthPct}%`,
                      zIndex: '1'
                    }}
                  />
                )}

                {/* ─── Live-overlay track ─── */}
                {hasLiveOverlay && (
                  <div
                    className={`${styles.livetrack} ${isFaceted ? styles.livetrackFaceted : styles.livetrackDefault}`}
                    style={{
                      left: `${liveLeftPct}%`,
                      width: `${liveWidthPct}%`,
                      zIndex: '2',
                    }}
                  />
                )}

                {stepMarkRow}

                {children /* thumbs */}
              </div>
            );
          }}
          renderThumb={({ props: thumbProps, index }) => {
            const { key, ...restThumbProps } = (thumbProps as any);
            const currentValue = index === 0 ? v0 : v1;
            return (
              <div
                key={key}
                {...restThumbProps}
                id={index === 0 ? sliderId : undefined}
                className={`${styles.thumbs} ${disabled ? styles.disabled : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-resize-col'}`}
                style={{
                  ...restThumbProps.style,
                  zIndex: '3'
                }}
                aria-label={ariaLabel || (index === 0 ? 'Minimum value' : 'Maximum value')}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={currentValue}
              />
            );
          }}
        />
      </div>
    );
  } else {
    // ─────────── Single-thumb "value" mode ───────────
    const singleValue = props.value as SingleValue;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={sliderId} className={styles.label}>
            {label}
          </label>
        )}
        <Range
          step={step}
          min={min}
          max={max}
          values={[singleValue]}
          onChange={(vals) => onChange(vals[0] as SingleValue)}
          onFinalChange={(vals) =>
            onFinalChange?.(vals[0] as SingleValue)
          }
          disabled={disabled}
          renderTrack={({ props: trackProps, children }) => {
            const { key, ...restTrackProps } = (trackProps as any);

            // Compute selected track from min to current value
            const span = max - min;
            const selectedWidthPct = ((singleValue - min) / span) * 100;

            // Compute live overlay if given
            let liveLeftPct = 0;
            let liveWidthPct = 0;
            const hasLiveOverlay =
              typeof activeMin === 'number' &&
              typeof activeMax === 'number' &&
              activeMax > activeMin &&
              (activeMin > min || activeMax < max);

            if (hasLiveOverlay) {
              liveLeftPct = ((activeMin! - min) / span) * 100;
              liveWidthPct = ((activeMax! - activeMin!) / span) * 100;
            }

            return (
              <div
                key={key}
                {...restTrackProps}
                className={trackClassName}
                style={{
                  ...restTrackProps.style,
                }}
              >
                {/* ─── Selected track (from start to thumb, hidden when active range shown) ─── */}
                {!hasLiveOverlay && (
                  <div
                    className={styles.selectedtrack}
                    style={{
                      left: '0%',
                      width: `${selectedWidthPct}%`,
                      zIndex: '1'
                    }}
                  />
                )}

                {/* ─── Live-overlay track ─── */}
                {hasLiveOverlay && (
                  <div
                    className={`${styles.livetrack} ${isFaceted ? styles.livetrackFaceted : styles.livetrackDefault}`}
                    style={{
                      left: `${liveLeftPct}%`,
                      width: `${liveWidthPct}%`,
                      zIndex: '2',
                    }}
                  />
                )}

                {stepMarkRow}

                {children /* single thumb (z=3) */}
              </div>
            );
          }}
          renderThumb={({ props: thumbProps }) => {
            const { key, ...restThumbProps } = (thumbProps as any);
            return (
              <div
                key={key}
                {...restThumbProps}
                id={sliderId}
                className={`${styles.thumbs} ${disabled ? styles.disabled : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-resize-col'}`}
                style={{
                  ...restThumbProps.style,
                  zIndex: '3'
                }}
                aria-label={ariaLabel}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={singleValue}
              />
            );
          }}
        />
      </div>
    );
  }
};
