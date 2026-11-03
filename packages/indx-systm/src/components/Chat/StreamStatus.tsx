import React from 'react';
import { Spinner } from '../Spinner/Spinner';
import type { SpinnerName } from '../Spinner/spinners.generated';
import styles from './Chat.module.css';

export interface StreamStatusProps {
  children: React.ReactNode;
  /** Which spinner plays beside the line, so each stage can have its own: `grow` while writing. */
  spinner?: SpinnerName;
  className?: string;
}

/** One quiet line saying what the assistant is doing right now — "Searching the docs…", "Writing…". */
export function StreamStatus({ children, spinner, className = '' }: StreamStatusProps) {
  return (
    <div className={`${styles.status} ${className}`} role="status">
      <span className={styles.statusSpinner}><Spinner name={spinner} size={14} /></span>
      <span>{children}</span>
    </div>
  );
}
