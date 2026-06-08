import React, { useState } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { Chevron_left, Chevron_right, Chevron_down } from '@indxsearch/pixl';
import styles from './DatePicker.module.css';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  isValid?: boolean;
  disabled?: boolean;
  className?: string;
  /** Format the selected date shown in the trigger. Default: ISO yyyy-mm-dd. */
  formatDate?: (date: Date) => string;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isoFormat(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// 6×7 day grid (Monday-first), including leading/trailing days from adjacent months.
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // getDay: 0=Sun → Mon-first index
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(year, month, 1 - startOffset + i));
  }
  return days;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select a date',
  error,
  isValid = true,
  disabled = false,
  className = '',
  formatDate = isoFormat,
}) => {
  const generatedId = React.useId();
  const errorId = `${generatedId}-error`;
  const hasError = !!error || !isValid;

  const [open, setOpen] = useState(false);
  const today = new Date();
  const initial = value ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // When opening, jump the calendar to the selected month.
  React.useEffect(() => {
    if (open && value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
    // Only react to open transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (d: Date) => {
    onChange?.(d);
    setOpen(false);
  };

  const grid = buildGrid(viewYear, viewMonth);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <RadixPopover.Root open={open} onOpenChange={setOpen}>
        <RadixPopover.Trigger asChild>
          <button
            type="button"
            className={`${styles.trigger} ${hasError ? styles.error : ''}`}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
          >
            <span className={value ? styles.valueText : styles.placeholder}>
              {value ? formatDate(value) : placeholder}
            </span>
            <Chevron_down size={14} color="currentColor" />
          </button>
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content className={styles.calendar} align="start" sideOffset={5}>
            <div className={styles.header}>
              <button type="button" className={styles.navButton} onClick={prevMonth} aria-label="Previous month">
                <Chevron_left size={14} color="currentColor" />
              </button>
              <span className={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" className={styles.navButton} onClick={nextMonth} aria-label="Next month">
                <Chevron_right size={14} color="currentColor" />
              </button>
            </div>
            <div className={styles.weekdays}>
              {WEEKDAYS.map((w) => <span key={w} className={styles.weekday}>{w}</span>)}
            </div>
            <div className={styles.grid}>
              {grid.map((d) => {
                const outside = d.getMonth() !== viewMonth;
                const selected = sameDay(d, value);
                const isToday = sameDay(d, today);
                const dayClass = [
                  styles.day,
                  outside ? styles.outside : '',
                  selected ? styles.selected : '',
                  isToday && !selected ? styles.today : '',
                ].filter(Boolean).join(' ');
                return (
                  <button key={d.toISOString()} type="button" className={dayClass} onClick={() => selectDay(d)}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
