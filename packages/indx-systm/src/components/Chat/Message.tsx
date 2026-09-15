import React from 'react';
import { Ai_agent } from '@indxsearch/pixl';
import styles from './Chat.module.css';

export interface UserMessageProps {
  children: React.ReactNode;
  className?: string;
}

/** What the person typed: right-aligned, on a raised tone. Line breaks are kept. */
export function UserMessage({ children, className = '' }: UserMessageProps) {
  return (
    <div className={styles.userRow}>
      <div className={`${styles.userMsg} ${className}`}>{children}</div>
    </div>
  );
}

export interface AssistantMessageProps {
  /** Name shown above the answer. */
  label?: string;
  /** Icon before the name; defaults to the pixl AI agent. */
  icon?: React.ReactNode;
  /** The answer and anything under it — `StreamStatus`, `CitationList`, `AnswerActions`. */
  children: React.ReactNode;
  className?: string;
}

/** The assistant's turn: a small labelled head, then whatever the answer is made of. */
export function AssistantMessage({ label = 'Assistant', icon, children, className = '' }: AssistantMessageProps) {
  return (
    <div className={`${styles.assistant} ${className}`}>
      <div className={styles.assistantHead}>
        {icon === undefined ? <Ai_agent color="currentColor" size={14} /> : icon}
        <span>{label}</span>
      </div>
      <div className={styles.assistantBody}>{children}</div>
    </div>
  );
}
