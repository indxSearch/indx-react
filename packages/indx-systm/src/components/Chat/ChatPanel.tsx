import React from 'react';
import styles from './Chat.module.css';

export interface ChatPanelProps {
  /** Rendered above the thread — typically a mode `Tabs`. */
  header?: React.ReactNode;
  /** The conversation: messages, status lines, suggestions. Scrolls independently. */
  children: React.ReactNode;
  /** Rendered below the thread — typically a `Composer`. */
  composer?: React.ReactNode;
  /** Keyboard hints under the composer; `false` hides the row. */
  hints?: React.ReactNode | false;
  className?: string;
  /** Ref to the scrolling thread, so a caller can keep the newest message in view. */
  threadRef?: React.Ref<HTMLDivElement>;
  'aria-label'?: string;
}

/** Keyboard hint pill for the hints row. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

/** Default hints: Enter sends, Shift+Enter breaks a line, Escape closes. */
export const defaultChatHints = (
  <>
    <span><Kbd>↵</Kbd> send</span>
    <span><Kbd>⇧↵</Kbd> new line</span>
    <span><Kbd>esc</Kbd> close</span>
  </>
);

/** The frame of a conversation: optional header, a scrolling thread, the composer and a hints row.
 *  Sized by its container — give it a height (or let a modal/dialog do so) and the thread scrolls. */
export function ChatPanel({ header, children, composer, hints = defaultChatHints, className = '', threadRef, 'aria-label': ariaLabel }: ChatPanelProps) {
  return (
    <div className={`${styles.panel} ${className}`} aria-label={ariaLabel}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.thread} ref={threadRef} role="log" aria-live="polite">{children}</div>
      {composer && <div className={styles.footer}>{composer}</div>}
      {hints !== false && hints && <div className={styles.hints}>{hints}</div>}
    </div>
  );
}
