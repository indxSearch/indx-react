import React, { useId, useState } from 'react';
import { Chevron_down, Chevron_right } from '@indxsearch/pixl';
import { Spinner } from '../Spinner/Spinner';
import styles from './Chat.module.css';

export interface ReasoningProps {
  /** The thinking, as text or markup. */
  children?: React.ReactNode;
  /** Still thinking: the row says so, with the spinner, and the thinking shows. */
  streaming?: boolean;
  /** How long it thought, for "Thought for 4s"; left out, "Thought". */
  seconds?: number;
  className?: string;
}

/** What an assistant thought before it answered, kept out of the answer's way. While it thinks the
 *  row says "Thinking…" with the spinner StreamStatus has and the thinking shows under it; once the
 *  answer begins it folds to "Thought for 4s" and opens again on a press. A reader's own choice
 *  outlasts the streaming. The Blazor Reasoning is its port. */
export function Reasoning({ children, streaming = false, seconds, className = '' }: ReasoningProps) {
  const [chosen, setChosen] = useState<boolean | null>(null);
  const id = useId();
  const open = chosen ?? streaming;
  const label = streaming ? 'Thinking…' : seconds == null ? 'Thought' : seconds < 1 ? 'Thought for a moment' : `Thought for ${seconds}s`;
  const chevron = open ? <Chevron_down size={14} color="currentColor" /> : <Chevron_right size={14} color="currentColor" />;
  return (
    <div className={`${styles.reasoning} ${className}`} data-state={streaming ? 'thinking' : 'done'}>
      <button type="button" className={styles.reasoningRow} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setChosen(!open)}>
        <span className={styles.reasoningIcon} aria-hidden="true">{streaming ? <Spinner size={14} /> : chevron}</span>
        <span>{label}</span>
        {streaming && <span className={styles.reasoningChevron} aria-hidden="true">{chevron}</span>}
      </button>
      {open && children != null && <div id={id} className={styles.reasoningBody}>{children}</div>}
    </div>
  );
}
