import React, { useEffect, useState } from 'react';
import {
  Alert, AlertTitle, AlertDescription, Button,
  UserMessage, AssistantMessage, CitationRef, CitationList, StreamStatus, AnswerActions,
} from '@indxsearch/systm';
import { Refresh } from '@indxsearch/pixl';
import { useAsk, type AskSource, type AskStatus } from '../hooks/useAsk';
import styles from './AskPanel.module.css';

export interface AskPanelProps {
  /** The question to answer. A new value asks it; null or empty shows nothing. To ask the same
   *  text again, give the panel a new `key`. */
  question: string | null;
  /** Called when the visitor picks a cited source. Look the record up by its documentKey. */
  onSourceClick?: (source: AskSource) => void;
  /** The label over the answer. Default "Answer". */
  label?: string;
  /** Renders the answer text, for a page with a markdown renderer of its own. `cite(n)` gives the
   *  citation mark for source n. Default: paragraphs of plain text with [n] as citation marks. */
  renderAnswer?: (answer: string, cite: (n: number) => React.ReactNode) => React.ReactNode;
  /** Shown under the answer: a follow-up action, e.g. back to the search field. */
  onFollowUp?: () => void;
  /** Told when the answer starts and stops streaming, e.g. to show a Stop button elsewhere. */
  onStatusChange?: (status: AskStatus) => void;
  className?: string;
}

const CITE = /\[(\d+)\]/g;

/** Plain text, paragraphs on blank lines, [n] as citation marks. */
function plainAnswer(answer: string, cite: (n: number) => React.ReactNode): React.ReactNode {
  return answer.split(/\n{2,}/).map((para, i) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const m of para.matchAll(CITE)) {
      parts.push(para.slice(last, m.index));
      parts.push(<React.Fragment key={`c${m.index}`}>{cite(Number(m[1]))}</React.Fragment>);
      last = m.index! + m[0].length;
    }
    parts.push(para.slice(last));
    return <p key={i} className={styles.paragraph}>{parts}</p>;
  });
}

/**
 * An answer to one question, written from the dataset's records by Search or ask: the question,
 * the answer as it streams, the sources it cites, and what to do when it fails or is limited.
 * Pair it with `useSearchOrAsk` (when to offer) or `SearchInput`'s `onAsk`.
 */
export const AskPanel: React.FC<AskPanelProps> = ({
  question, onSourceClick, label = 'Answer', renderAnswer = plainAnswer, onFollowUp, onStatusChange, className = '',
}) => {
  const asked = useAsk();
  const { ask, reset, status, openSource } = asked;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (question?.trim()) void ask(question);
    else reset();
  }, [question, ask, reset]);

  useEffect(() => { onStatusChange?.(status); }, [status, onStatusChange]);

  if (status === 'idle') return null;

  const source = (n: number) => asked.sources.find(s => s.n === n);
  const pick = (s: AskSource) => (e: React.MouseEvent) => { e.preventDefault(); void openSource(s); onSourceClick?.(s); };
  const cite = (n: number) => {
    const s = source(n);
    return <CitationRef n={n} title={s?.title} onClick={s && onSourceClick ? pick(s) : undefined} />;
  };
  const cited = new Set([...asked.answer.matchAll(CITE)].map(m => Number(m[1])));
  const listed = status === 'answered' && cited.size > 0 ? asked.sources.filter(s => cited.has(s.n)) : asked.sources.slice(0, 3);

  const copy = () => {
    navigator.clipboard?.writeText(asked.answer.replace(CITE, '')).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.panel} ${className}`} aria-live="polite" aria-busy={asked.busy}>
      <UserMessage>{asked.question}</UserMessage>
      <AssistantMessage label={label}>
        {asked.answer && <div className={styles.answer}>{renderAnswer(asked.answer, cite)}</div>}
        {status === 'searching' && <StreamStatus>Searching…</StreamStatus>}
        {status === 'writing' && <StreamStatus>Writing…</StreamStatus>}
        {status === 'error' && (
          <Alert variant="default" icon={null}>
            <AlertTitle>{asked.error?.code === 'nothingFound' ? 'Nothing to answer from' : 'The answer did not come through'}</AlertTitle>
            <AlertDescription>
              {asked.error?.code === 'nothingFound'
                ? 'The search found no records about this. Try other words, or search instead.'
                : asked.error?.message}
            </AlertDescription>
            {asked.error?.code !== 'nothingFound' && (
              <div className={styles.action}>
                <Button variant="secondary" size="micro" iconLeft={<Refresh />} onClick={() => ask(asked.question)}>Try again</Button>
              </div>
            )}
          </Alert>
        )}
        {status === 'limited' && (
          <Alert variant="default" icon={null}>
            <AlertTitle>Too many questions for now</AlertTitle>
            <AlertDescription>
              You can ask again in about {asked.retryAfterSeconds && asked.retryAfterSeconds > 90 ? `${Math.ceil(asked.retryAfterSeconds / 60)} minutes` : 'a minute'}. Search still works in the meantime.
            </AlertDescription>
          </Alert>
        )}
        {listed.length > 0 && status !== 'error' && status !== 'limited' && (
          <CitationList items={listed.map(s => ({ n: s.n, title: s.title, onClick: onSourceClick ? pick(s) : undefined }))} />
        )}
        {status === 'answered' && <AnswerActions onCopy={copy} copied={copied} onFollowUp={onFollowUp} />}
      </AssistantMessage>
    </div>
  );
};
