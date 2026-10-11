import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, AlertTitle, AlertDescription, Button,
  UserMessage, AssistantMessage, CitationRef, CitationList, StreamStatus, AnswerActions, Composer,
} from '@indxsearch/systm';
import type { ComposerHandle } from '@indxsearch/systm';
import { Refresh } from '@indxsearch/pixl';
import { useAsk, type AskSource, type AskStatus, type AskTurn } from '../hooks/useAsk';
import styles from './AskPanel.module.css';

export interface AskPanelProps {
  /** The question to answer. A new value asks it and starts a new conversation; null or empty
   *  shows nothing. To ask the same text again, give the panel a new `key`. */
  question: string | null;
  /** Lets the visitor ask follow-up questions under the answer. Each is answered with the
   *  conversation so far (the server uses the last three turns), and the earlier turns stay on
   *  screen above it. */
  followUps?: boolean;
  /** Called when the visitor picks a cited source. Look the record up by its documentKey. */
  onSourceClick?: (source: AskSource) => void;
  /** The label over each answer. Default "Answer". */
  label?: string;
  /** Renders the answer text, for a page with a markdown renderer of its own. `cite(n)` gives the
   *  citation mark for source n. Default: paragraphs of plain text with [n] as citation marks. */
  renderAnswer?: (answer: string, cite: (n: number) => React.ReactNode) => React.ReactNode;
  /** Shown under the answer as "Ask a follow-up" when `followUps` is off: e.g. back to the
   *  search field. With `followUps` on, that button goes to the follow-up field instead. */
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

/** A finished turn of the conversation, kept on screen above the current one. */
interface PastTurn {
  question: string;
  answer: string;
  sources: AskSource[];
  askId?: string;
}

/**
 * An answer to a question, written from the dataset's records by Search or ask: the question, the
 * answer as it streams, the sources it cites, and what to do when it fails or is limited. With
 * `followUps`, a conversation: a field under the answer asks the next question with the earlier
 * ones as context. Pair it with `SearchInput`'s `onAsk`, or `useSearchOrAsk` (when to offer).
 */
export const AskPanel: React.FC<AskPanelProps> = ({
  question, followUps = false, onSourceClick, label = 'Answer', renderAnswer = plainAnswer, onFollowUp, onStatusChange,
  className = '',
}) => {
  const asked = useAsk();
  const { ask, reset, stop, status, openSource } = asked;
  const [copied, setCopied] = useState(false);
  const [past, setPast] = useState<PastTurn[]>([]);
  const [draft, setDraft] = useState('');
  const history = useRef<AskTurn[]>([]);
  const composer = useRef<ComposerHandle>(null);

  // A new question from the page starts a new conversation.
  useEffect(() => {
    setPast([]);
    history.current = [];
    if (question?.trim()) void ask(question);
    else reset();
  }, [question, ask, reset]);

  useEffect(() => { onStatusChange?.(status); }, [status, onStatusChange]);

  if (status === 'idle' && past.length === 0) return null;

  const pick = (s: AskSource, askId?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    void openSource(s, askId);
    onSourceClick?.(s);
  };
  const citeFrom = (sources: AskSource[], askId?: string) => (n: number) => {
    const s = sources.find(x => x.n === n);
    return <CitationRef n={n} title={s?.title} onClick={s && onSourceClick ? pick(s, askId) : undefined} />;
  };
  const citedSources = (answer: string, sources: AskSource[], done: boolean) => {
    const cited = new Set([...answer.matchAll(CITE)].map(m => Number(m[1])));
    return done && cited.size > 0 ? sources.filter(s => cited.has(s.n)) : sources.slice(0, 3);
  };
  const sourceList = (answer: string, sources: AskSource[], done: boolean, askId?: string) => {
    const listed = citedSources(answer, sources, done);
    return listed.length > 0 && (
      <CitationList items={listed.map(s => ({ n: s.n, title: s.title, onClick: onSourceClick ? pick(s, askId) : undefined }))} />
    );
  };

  const copy = () => {
    navigator.clipboard?.writeText(asked.answer.replace(CITE, '')).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // The finished turn moves up into the conversation, and the follow-up is asked with it.
  const sendFollowUp = (text: string) => {
    if (asked.busy || !text.trim()) return;
    if (status === 'answered' && asked.answer) {
      const turn = { question: asked.question, answer: asked.answer, sources: asked.sources, askId: asked.askId };
      setPast(p => [...p, turn]);
      history.current = [...history.current, { question: turn.question, answer: turn.answer }];
    }
    setDraft('');
    void ask(text, history.current);
  };

  const followUpAction = followUps ? () => composer.current?.focus() : onFollowUp;

  return (
    <div className={`${styles.panel} ${className}`} aria-live="polite" aria-busy={asked.busy}>
      {past.map((t, i) => (
        <div key={i} className={styles.turn}>
          <UserMessage>{t.question}</UserMessage>
          <AssistantMessage label={label}>
            <div className={styles.answer}>{renderAnswer(t.answer, citeFrom(t.sources, t.askId))}</div>
            {sourceList(t.answer, t.sources, true, t.askId)}
          </AssistantMessage>
        </div>
      ))}
      {status !== 'idle' && (
        <div className={styles.turn}>
          <UserMessage>{asked.question}</UserMessage>
          <AssistantMessage label={label}>
            {asked.answer && <div className={styles.answer}>{renderAnswer(asked.answer, citeFrom(asked.sources))}</div>}
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
                    <Button variant="secondary" size="micro" iconLeft={<Refresh />} onClick={() => ask(asked.question, history.current)}>Try again</Button>
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
            {status !== 'error' && status !== 'limited' && sourceList(asked.answer, asked.sources, status === 'answered')}
            {status === 'answered' && <AnswerActions onCopy={copy} copied={copied} onFollowUp={followUpAction} />}
          </AssistantMessage>
        </div>
      )}
      {followUps && (
        <Composer ref={composer} value={draft} onChange={setDraft} onSend={sendFollowUp} onStop={stop}
                  streaming={asked.busy} placeholder="Ask a follow-up…" aria-label="Ask a follow-up" />
      )}
    </div>
  );
};
