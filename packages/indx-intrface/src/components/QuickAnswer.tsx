import React from 'react';
import { Button, Kbd, ShimmerText } from '@indxsearch/systm';
import { Ai_agent } from '@indxsearch/pixl';
import type { SearchOrAskState } from '../hooks/useSearchOrAsk';
import styles from './QuickAnswer.module.css';

export interface QuickAnswerProps {
  /** The page's `useSearchOrAsk()`, the same one SearchInput is handed. */
  searchOrAsk: SearchOrAskState;
  /** Called with the text to ask, as SearchInput's `onAsk`. */
  onAsk: (text: string) => void;
  /** The words, for a page in another language. */
  labels?: Partial<Record<'invite' | 'hint' | 'ready' | 'thinking', string>>;
  className?: string;
}

const LABELS = {
  invite: 'Ask about this',
  hint: 'For a quick answer, type a bit more',
  ready: 'Ask the assistant',
  thinking: 'Thinking',
};

/**
 * Search or ask's offer as a row of its own, for above the results, as Notion's quick answer: what
 * the visitor typed reads as a question, and the row says what asking would do. It draws the
 * hook's `quick` state. In inviting and proactive the invitation sweeps as soon as a question starts
 * ("For a quick answer, type a bit more"), meant to teach a visitor that the field answers too; in
 * proactive the sure offer is no button but "Thinking", sweeping, until the answer starts on its
 * own. Nothing shows when there is nothing to offer, and a click on any of it asks.
 */
export const QuickAnswer: React.FC<QuickAnswerProps> = ({ searchOrAsk: sor, onAsk, labels, className = '' }) => {
  const words = { ...LABELS, ...labels };
  const text = sor.text.trim();
  if (!sor.available || sor.quick === 'none' || !text) return null;
  const ask = () => onAsk(text);

  return (
    <div className={`${styles.row} ${styles[sor.quick]} ${className}`} aria-live="polite">
      <span className={styles.icon} aria-hidden="true"><Ai_agent size={14} color="currentColor" /></span>
      {sor.quick === 'thinking' && <ShimmerText className={styles.text}>{words.thinking}</ShimmerText>}
      {sor.quick === 'hint' && (
        <button type="button" className={styles.line} onClick={ask}><ShimmerText>{words.hint}</ShimmerText></button>
      )}
      {sor.quick === 'invite' && (
        <button type="button" className={styles.line} onClick={ask}>{words.invite}</button>
      )}
      {sor.quick === 'ready' && (
        <>
          <span className={styles.question}>{text}</span>
          <span className={styles.actions}>
            <span className={styles.enter}><Kbd>↵</Kbd> to ask</span>
            <Button variant="primary" size="micro" onClick={ask}>{words.ready}</Button>
          </span>
        </>
      )}
    </div>
  );
};
