import React, { useId, useState } from 'react';
import { Check, Chevron_down, Chevron_right, X_or_error } from '@indxsearch/pixl';
import { Spinner } from '../Spinner/Spinner';
import styles from './Chat.module.css';

interface IconProps {
  size?: string | number;
  color?: string;
}

export interface ToolStepProps {
  /** What was done, as a short past-tense line (or present, while running). */
  children: React.ReactNode;
  state?: 'running' | 'done' | 'error';
  /** What came of it, after the line: "12 records", "timed out". */
  meta?: React.ReactNode;
  /** The tool's pixl icon, shown when done; a check without one. */
  icon?: React.ReactElement<IconProps>;
  /** What went in and what came back, shown when the row is opened. */
  detail?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/** One thing an assistant did on its way to an answer, with what came of it. Running it has the
 *  spinner StreamStatus has; done, the tool's icon; failed, the error mark in the signal colour.
 *  With `detail` the row opens. Stack them in `ToolSteps`. */
export function ToolStep({ children, state = 'done', meta, icon, detail, defaultOpen = false, className = '' }: ToolStepProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const mark = state === 'running' ? <Spinner size={14} />
    : state === 'error' ? <X_or_error size={14} color="currentColor" />
    : icon ? React.cloneElement(icon, { size: 14, color: 'currentColor' })
    : <Check size={14} color="currentColor" />;
  const row = (
    <>
      <span className={styles.toolIcon}>{mark}</span>
      <span className={styles.toolLabel}>{children}</span>
      {meta != null && meta !== '' && <span className={styles.toolMeta}>{meta}</span>}
    </>
  );
  return (
    <div className={`${styles.tool} ${className}`} data-state={state} aria-busy={state === 'running' || undefined}>
      {detail != null ? (
        <button type="button" className={`${styles.toolRow} ${styles.toolRowOpen}`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(o => !o)}>
          {row}
          <span className={styles.toolChevron} aria-hidden="true">
            {open ? <Chevron_down size={14} color="currentColor" /> : <Chevron_right size={14} color="currentColor" />}
          </span>
        </button>
      ) : (
        <div className={styles.toolRow}>{row}</div>
      )}
      {open && detail != null && <div id={id} className={styles.toolDetail}>{detail}</div>}
    </div>
  );
}

export interface ToolStepsProps {
  children: React.ReactNode;
  /** Folds the steps into one row that says this, "3 steps"; left out, they show. */
  summary?: React.ReactNode;
  /** With a summary, open from the start. */
  defaultOpen?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** The steps an assistant took, ToolStep under ToolStep, close together inside a message. With a
 *  `summary` they fold into one quiet row that opens to show them, for a finished answer. */
export function ToolSteps({ children, summary, defaultOpen = false, 'aria-label': ariaLabel = 'Steps', className = '' }: ToolStepsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`${styles.toolSteps} ${className}`} role="group" aria-label={ariaLabel}>
      {summary != null ? (
        <>
          <button type="button" className={styles.toolStepsSummary} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(o => !o)}>
            <span className={styles.toolStepsChevron} aria-hidden="true">
              {open ? <Chevron_down size={14} color="currentColor" /> : <Chevron_right size={14} color="currentColor" />}
            </span>
            <span>{summary}</span>
          </button>
          {open && <div id={id} className={styles.toolStepsList}>{children}</div>}
        </>
      ) : children}
    </div>
  );
}
