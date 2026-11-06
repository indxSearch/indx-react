import React from 'react';
import { Slider } from '../Slider/Slider';
import { InputField } from '../InputField/InputField';
import styles from './SliderField.module.css';

export interface SliderFieldProps {
  value: number;
  onChange: (value: number) => void;
  /** The slider's range. The number may hold a value beyond it; the slider then rests at its end. */
  min: number;
  max: number;
  /** The slider's step. */
  step?: number;
  /** The number's own range, none by default. */
  fieldMin?: number;
  fieldMax?: number;
  /** What the arrow keys add in the number. The slider's step by default. */
  fieldStep?: number;
  /** How the number is written. Up to three decimals by default. */
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
}

const defaultFormat = (v: number) => String(Math.round(v * 1000) / 1000);

/**
 * A slider and the number it holds, side by side. The slider moves in its steps between min and
 * max; the number takes any value from fieldMin to fieldMax, typed or stepped with the arrow keys,
 * and the slider follows as far as it reaches. The number is a ghost field: no stroke until it is
 * being edited, a ghost button's tint when pointed at.
 */
export function SliderField({
  value, onChange, min, max, step = 1, fieldMin, fieldMax, fieldStep, format = defaultFormat,
  disabled = false, className = '', 'aria-label': ariaLabel,
}: SliderFieldProps) {
  // What is typed stays as typed while the field is being edited; leaving it shows the value.
  const [draft, setDraft] = React.useState<string | null>(null);

  const typed = (text: string) => {
    setDraft(text);
    const v = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    onChange(Math.min(fieldMax ?? Infinity, Math.max(fieldMin ?? -Infinity, v)));
  };

  return (
    <div className={`${styles.sliderField} ${className}`}>
      <Slider className={styles.slider} min={min} max={max} step={step} disabled={disabled} aria-label={ariaLabel}
        value={Math.min(max, Math.max(min, value))}
        onChange={v => onChange(Math.round((v as number) * 1e10) / 1e10)} />
      <InputField variant="ghost" type="number" className={styles.field} disabled={disabled}
        step={fieldStep ?? step} min={fieldMin} max={fieldMax} aria-label={`${ariaLabel}, value`}
        value={draft ?? format(value)} onChange={e => typed(e.target.value)} onBlur={() => setDraft(null)} />
    </div>
  );
}
