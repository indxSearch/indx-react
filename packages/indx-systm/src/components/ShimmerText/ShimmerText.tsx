import React from 'react';
import styles from './ShimmerText.module.css';

export interface ShimmerTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  /** The highlight sweeps while true; false is the same text, still. Default true. */
  active?: boolean;
}

/** Text a highlight sweeps across, left to right, as Notion's quick answer has it: for a line that
 *  says something is about to happen ("Thinking", "For a quick answer, type a bit more"). The one
 *  motion in systm that runs before anything is computing (27 Oct 2026): it invites. Still under
 *  prefers-reduced-motion. The Blazor ShimmerText is its port. */
export function ShimmerText({ children, active = true, className = '', ...rest }: ShimmerTextProps) {
  return <span className={`${styles.text} ${active ? styles.active : ''} ${className}`} {...rest}>{children}</span>;
}
