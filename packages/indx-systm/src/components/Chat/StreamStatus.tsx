import React from 'react';
import { Spinner } from '../Spinner/Spinner';
import styles from './Chat.module.css';

export interface StreamStatusProps {
  children: React.ReactNode;
  className?: string;
}

/** One quiet line saying what the assistant is doing right now — "Searching the docs…", "Writing…". */
export function StreamStatus({ children, className = '' }: StreamStatusProps) {
  return (
    <div className={`${styles.status} ${className}`} role="status">
      <span className={styles.statusSpinner}><Spinner size={14} /></span>
      <span>{children}</span>
    </div>
  );
}
