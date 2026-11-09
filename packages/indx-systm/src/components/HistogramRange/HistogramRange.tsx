import React, { useMemo, useRef, useState } from 'react';
import { InputField } from '../InputField/InputField';
import styles from './HistogramRange.module.css';

/** One bar: the first and last value it holds and how many records hold them. */
export interface HistogramBar {
  from: number;
  to: number;
  count: number;
}

export interface HistogramRangeValue {
  /** null is open at that end. */
  from: number | null;
  to: number | null;
}

export interface HistogramRangeProps {
  /** The field's values and their counts, in any order. */
  values: ReadonlyArray<readonly [number, number]>;
  value: HistogramRangeValue;
  /** Once the range is picked: a drag ended, a bar clicked, an end typed. */
  onChange: (value: HistogramRangeValue) => void;
  /** At most this many bars; fewer values than this are a bar each. */
  maxBars?: number;
  /** What the arrow keys add in the numbers; any by default. */
  step?: number;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
}

const fmt = (v: number) => String(Number(v.toFixed(8)));

/** The values as bars: a bar each when there are no more than maxBars, else that many of equal
 *  width from the lowest to the highest, each spanning the values it holds. */
export function barsOf(values: ReadonlyArray<readonly [number, number]>, maxBars: number): HistogramBar[] {
  const sorted = values.filter(([v]) => Number.isFinite(v)).slice().sort((a, b) => a[0] - b[0]);
  if (sorted.length === 0) return [];
  if (sorted.length <= maxBars) return sorted.map(([v, n]) => ({ from: v, to: v, count: n }));
  const lo = sorted[0][0], hi = sorted[sorted.length - 1][0], width = (hi - lo) / maxBars;
  const bars: HistogramBar[] = [];
  let at = 0;
  for (let i = 0; i < maxBars; i++) {
    const end = i === maxBars - 1 ? Infinity : lo + (i + 1) * width;
    const first = at;
    let count = 0;
    while (at < sorted.length && sorted[at][0] < end) count += sorted[at++][1];
    bars.push(at > first
      ? { from: sorted[first][0], to: sorted[at - 1][0], count }
      : { from: lo + i * width, to: Math.min(hi, lo + (i + 1) * width), count: 0 });
  }
  return bars;
}

/**
 * A range over a number field's values, picked on their histogram or typed. The bars are the
 * counts of the values given, gathered into at most maxBars; under them from and to are ghost
 * numbers. Dragging across the bars writes the numbers, typing a number lights the bars it
 * reaches: one range, two ways in. An empty end is open; clicking the one bar that is the whole
 * range clears it. The port of the Blazor HistogramRange (the console's search preview).
 */
export function HistogramRange({ values, value, onChange, maxBars = 30, step, disabled = false, className = '', 'aria-label': ariaLabel }: HistogramRangeProps) {
  const bars = useMemo(() => barsOf(values, maxBars), [values, maxBars]);
  const most = Math.max(1, ...bars.map(b => b.count));
  const ref = useRef<HTMLDivElement>(null);
  // While dragging, the bars from the one pressed to the one under the pointer; the range itself
  // changes once the pointer is let go.
  const [drag, setDrag] = useState<[number, number] | null>(null);
  // What is typed stays as typed while a field is being edited; leaving it shows the range.
  const [draft, setDraft] = useState<{ from?: string; to?: string }>({});

  const hasRange = value.from != null || value.to != null;
  const inRange = (bar: HistogramBar, i: number) =>
    drag ? i >= Math.min(...drag) && i <= Math.max(...drag)
      : hasRange && (value.from == null || bar.to >= value.from) && (value.to == null || bar.from <= value.to);

  const barAt = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(bars.length - 1, Math.floor(((clientX - rect.left) / rect.width) * bars.length)));
  };

  const pick = (a: number, b: number) => {
    const lo = bars[Math.min(a, b)], hi = bars[Math.max(a, b)];
    if (a === b && value.from === lo.from && value.to === hi.to) onChange({ from: null, to: null });
    else onChange({ from: lo.from, to: hi.to });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0 || bars.length === 0) return;
    e.preventDefault();
    const anchor = barAt(e.clientX);
    setDrag([anchor, anchor]);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const at = barAt(e.clientX);
    if (at !== drag[1]) setDrag([drag[0], at]);
  };
  const onPointerUp = () => {
    if (!drag) return;
    pick(drag[0], drag[1]);
    setDrag(null);
  };

  const commit = (end: 'from' | 'to', text: string) => {
    setDraft(d => ({ ...d, [end]: undefined }));
    if (text.trim() === '') { onChange({ ...value, [end]: null }); return; }
    const v = Number(text.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    let next = { ...value, [end]: v };
    // Ends typed the wrong way round are the same range.
    if (next.from != null && next.to != null && next.from > next.to) next = { from: next.to, to: next.from };
    onChange(next);
  };

  const field = (end: 'from' | 'to', placeholder?: number) => (
    <InputField variant="ghost" type="number" step={step ?? 'any'} disabled={disabled}
      className={end === 'to' ? styles.upto : undefined}
      placeholder={placeholder != null ? fmt(placeholder) : undefined} aria-label={`${ariaLabel}, ${end}`}
      value={draft[end] ?? (value[end] != null ? fmt(value[end]!) : '')}
      onChange={e => setDraft(d => ({ ...d, [end]: e.target.value }))}
      onBlur={e => commit(end, e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') commit(end, (e.target as HTMLInputElement).value); }} />
  );

  return (
    <div className={`${styles.histrange} ${disabled ? styles.disabled : ''} ${className}`}>
      {bars.length > 0 && (
        <div ref={ref} className={styles.bars} aria-hidden="true"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          {bars.map((bar, i) => (
            <div key={i} className={`${styles.bar} ${inRange(bar, i) ? styles.barIn : ''}`}
              style={{ height: `${Math.max(6, (bar.count / most) * 100)}%` }}
              title={`${bar.from === bar.to ? fmt(bar.from) : `${fmt(bar.from)} to ${fmt(bar.to)}`}: ${bar.count.toLocaleString('en')}`} />
          ))}
        </div>
      )}
      <div className={styles.ends}>
        {field('from', bars[0]?.from)}
        <span>to</span>
        {field('to', bars[bars.length - 1]?.to)}
      </div>
    </div>
  );
}
