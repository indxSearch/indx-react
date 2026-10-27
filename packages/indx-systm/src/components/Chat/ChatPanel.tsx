import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
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
  /** The Latest button over the thread while it is scrolled up; `false` leaves it out. */
  jumpToLatest?: boolean;
  jumpLabel?: string;
}

/** px from the end before the thread counts as scrolled up. */
const AWAY = 80;

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
 *  Sized by its container — give it a height (or let a modal/dialog do so) and the thread scrolls.
 *  Scrolled up from the newest turn, a Latest button over the bottom of the thread takes the reader
 *  back, at once (systm moves only while waiting); the thread growing below them shows it too. */
export function ChatPanel({ header, children, composer, hints = defaultChatHints, className = '', threadRef, 'aria-label': ariaLabel, jumpToLatest = true, jumpLabel = 'Latest' }: ChatPanelProps) {
  const [thread, setThread] = useState<HTMLDivElement | null>(null);
  const [away, setAway] = useState(false);
  const outer = useRef(threadRef);
  outer.current = threadRef;
  const attach = useCallback((el: HTMLDivElement | null) => {
    setThread(el);
    const r = outer.current;
    if (typeof r === 'function') r(el);
    else if (r) (r as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, []);

  useEffect(() => {
    if (!thread || !jumpToLatest) return;
    const update = () => setAway(thread.scrollHeight - thread.scrollTop - thread.clientHeight > AWAY);
    thread.addEventListener('scroll', update, { passive: true });
    const mutations = new MutationObserver(update);
    mutations.observe(thread, { childList: true, subtree: true, characterData: true });
    const resize = new ResizeObserver(update);
    resize.observe(thread);
    update();
    return () => { thread.removeEventListener('scroll', update); mutations.disconnect(); resize.disconnect(); };
  }, [thread, jumpToLatest]);

  const jump = () => { if (thread) { thread.scrollTop = thread.scrollHeight; setAway(false); } };

  return (
    <div className={`${styles.panel} ${className}`} aria-label={ariaLabel}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.body}>
        <div className={styles.thread} ref={attach} role="log" aria-live="polite">{children}</div>
        {jumpToLatest && away && (
          <span className={styles.jump}><Button variant="secondary" size="micro" iconLeft={<ArrowDown />} onClick={jump}>{jumpLabel}</Button></span>
        )}
      </div>
      {composer && <div className={styles.footer}>{composer}</div>}
      {hints !== false && hints && <div className={styles.hints}>{hints}</div>}
    </div>
  );
}
