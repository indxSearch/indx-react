import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, AlertTitle, AlertDescription, Button,
  UserMessage, AssistantMessage, CitationRef, CitationList, StreamStatus, AnswerActions, Composer, Chip,
} from '@indxsearch/systm';
import type { ComposerHandle } from '@indxsearch/systm';
import { Refresh } from '@indxsearch/pixl';
import { useAsk, type AskSource, type AskStatus, type AskTurn, type AskFilters, type AskPicks } from '../hooks/useAsk';
import { answerMarkdown } from '../utils/answerMarkdown';
import styles from './AskPanel.module.css';

export interface AskPanelProps {
  /** The question to answer. A new value asks it and starts a new conversation; null or empty
   *  shows nothing. To ask the same text again, give the panel a new `key`. */
  question: string | null;
  /** The page started this question on its own, in the proactive mode (`useSearchOrAsk`'s
   *  `answerNow`), rather than the visitor asking it: the statistics count it apart. Pass the
   *  `proactive` that `SearchInput`'s `onAsk` hands over. */
  proactive?: boolean;
  /** Lets the visitor ask follow-up questions under the answer. Each is answered with the
   *  conversation so far (the server uses the last three turns), and the earlier turns stay on
   *  screen above it. */
  followUps?: boolean;
  /** Called when the visitor picks a cited source. Look the record up by its documentKey. */
  onSourceClick?: (source: AskSource) => void;
  /** The label over each answer. Default "Answer". */
  label?: string;
  /** Renders the answer text, for a page with a markdown renderer of its own. `cite(n)` gives the
   *  citation mark for source n. Default: intrface's own markdown (paragraphs, headings, lists,
   *  code blocks, inline code, bold, italics, links), with [n] as citation marks. */
  renderAnswer?: (answer: string, cite: (n: number) => React.ReactNode) => React.ReactNode;
  /** Shown under the answer as "Ask a follow-up" when `followUps` is off: e.g. back to the
   *  search field. With `followUps` on, that button goes to the follow-up field instead. */
  onFollowUp?: () => void;
  /** On a catalogue, called with the filters a description was searched with, as soon as they are
   *  known: give them to `useFilterSuggestion().apply` so the page's list shows the same set. */
  onFilters?: (filters: AskFilters) => void;
  /** On a catalogue, called with the records the assistant picked, as soon as they are known: show
   *  them as the page's list with `SearchResults`' `picks`, while the conversation is open. */
  onPicks?: (picks: AskPicks) => void;
  /** How a filter reads on its chip. Default: a text value as itself, a yes/no by its field's
   *  name, a range by its bounds. */
  filterLabel?: (filter: AskFilters['filters'][number]) => string;
  /** Told when the answer starts and stops streaming, e.g. to show a Stop button elsewhere. */
  onStatusChange?: (status: AskStatus) => void;
  /** Fills the height its container gives it, for a panel beside the results: the conversation
   *  scrolls on its own, the follow-up field stays at the bottom, and the view follows an answer
   *  as it streams while the visitor is at the end of it. Give the container a height (or make it
   *  a flex child that has one). Without it the panel is as tall as its content. */
  fill?: boolean;
  className?: string;
}

const CITE = /\[(\d+)\]/g;

/** Errors a Try again cannot change: nothing to answer from, or asking not on here. */
const NOT_HERE = new Set(['nothingFound', 'searchOrAskDisabled', 'searchOrAskUnavailable', 'http404']);

/** A finished turn of the conversation, kept on screen above the current one. */
interface PastTurn {
  question: string;
  answer: string;
  sources: AskSource[];
  askId?: string;
  filters?: AskFilters;
  picks?: AskPicks;
}

function defaultFilterLabel(f: AskFilters['filters'][number]): string {
  const name = f.field.split('.')[0]!;
  if (f.value === 'true') return name;
  if (f.value === 'false') return `not ${name}`;
  if (f.value != null) return f.value;
  if (f.min != null && f.max != null) return f.min === f.max ? `${name} ${f.min}` : `${name} ${f.min}–${f.max}`;
  return f.min != null ? `${name} ≥ ${f.min}` : `${name} ≤ ${f.max}`;
}

/**
 * An answer to a question, written from the dataset's records by Search or ask: the question, the
 * answer as it streams, the sources it cites, and what to do when it fails or is limited. With
 * `followUps`, a conversation: a field under the answer asks the next question with the earlier
 * ones as context. Pair it with `SearchInput`'s `onAsk`, or `useSearchOrAsk` (when to offer).
 */
export const AskPanel: React.FC<AskPanelProps> = ({
  question, proactive = false, followUps = false, onSourceClick, label = 'Answer', renderAnswer = answerMarkdown, onFollowUp, onStatusChange,
  onFilters, onPicks, filterLabel = defaultFilterLabel, fill = false, className = '',
}) => {
  const asked = useAsk();
  const { ask, reset, stop, status, openSource } = asked;
  const [copied, setCopied] = useState(false);
  const [past, setPast] = useState<PastTurn[]>([]);
  const [draft, setDraft] = useState('');
  const history = useRef<AskTurn[]>([]);
  const composer = useRef<ComposerHandle>(null);
  const thread = useRef<HTMLDivElement>(null);
  // At the end of the conversation the view follows what streams in; scrolled up to read, it stays.
  const atEnd = useRef(true);

  // A new question from the page starts a new conversation.
  useEffect(() => {
    setPast([]);
    history.current = [];
    if (question?.trim()) void ask(question, [], { proactive });
    else reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a question is asked once, as whoever started it
  }, [question, ask, reset]);

  useEffect(() => { onStatusChange?.(status); }, [status, onStatusChange]);

  // Each description's filters go to the page once, when they arrive.
  const sentFilters = useRef<AskFilters | undefined>(undefined);
  useEffect(() => {
    if (asked.filters && asked.filters !== sentFilters.current) {
      sentFilters.current = asked.filters;
      onFilters?.(asked.filters);
    }
  }, [asked.filters, onFilters]);

  // And the picks, once, when they arrive.
  const sentPicks = useRef<AskPicks | undefined>(undefined);
  useEffect(() => {
    if (asked.picks && asked.picks !== sentPicks.current) {
      sentPicks.current = asked.picks;
      onPicks?.({ ...asked.picks, askId: asked.picks.askId ?? asked.askId });
    }
  }, [asked.picks, asked.askId, onPicks]);

  // With fill, keep the end in view as the answer grows and as turns are added.
  useEffect(() => {
    const el = thread.current;
    if (fill && el && atEnd.current) el.scrollTop = el.scrollHeight;
  }, [fill, asked.answer, asked.steps.length, status, past.length]);
  const onThreadScroll = () => {
    const el = thread.current;
    if (el) atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const searched = (f?: AskFilters) => f && (
    <div className={styles.searched}>
      <span className={styles.searchedLabel}>{f.more ? `${f.found}+` : f.found} found</span>
      {f.filters.map((x, i) => <Chip key={i}>{filterLabel(x)}</Chip>)}
      {f.text && <span className={styles.searchedLabel}>“{f.text}”</span>}
      {f.sort && <span className={styles.searchedLabel}>sorted by {f.sort.field.split('.')[0]}, {f.sort.descending ? 'largest' : 'smallest'} first</span>}
    </div>
  );

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
  // The picks are the page's list, so the answer names them all, numbered as the list is.
  const sourceList = (answer: string, sources: AskSource[], done: boolean, askId?: string, picked = false) => {
    const listed = picked ? sources : citedSources(answer, sources, done);
    return listed.length > 0 && (
      <CitationList label={picked ? 'Picked' : undefined}
                    items={listed.map(s => ({ n: s.n, title: s.title, onClick: onSourceClick ? pick(s, askId) : undefined }))} />
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
      const turn = { question: asked.question, answer: asked.answer, sources: asked.sources, askId: asked.askId, filters: asked.filters, picks: asked.picks };
      setPast(p => [...p, turn]);
      history.current = [...history.current, {
        question: turn.question, answer: turn.answer,
        ...(turn.picks ? { shown: { picks: turn.picks.picks.map(x => ({ documentKey: x.documentKey, title: x.title })) } }
          : turn.filters ? { shown: { filters: turn.filters.filters, text: turn.filters.text, sort: turn.filters.sort ?? null } } : {}),
      }];
    }
    setDraft('');
    void ask(text, history.current);
  };

  const followUpAction = followUps ? () => composer.current?.focus() : onFollowUp;

  return (
    <div className={`${styles.panel} ${fill ? styles.fill : ''} ${className}`} aria-live="polite" aria-busy={asked.busy}>
      <div ref={thread} className={styles.thread} onScroll={fill ? onThreadScroll : undefined}>
      {past.map((t, i) => (
        <div key={i} className={styles.turn}>
          <UserMessage>{t.question}</UserMessage>
          <AssistantMessage label={label}>
            {searched(t.filters)}
            <div className={styles.answer}>{renderAnswer(t.answer, citeFrom(t.sources, t.askId))}</div>
            {sourceList(t.answer, t.sources, true, t.askId, !!t.picks)}
          </AssistantMessage>
        </div>
      ))}
      {status !== 'idle' && (
        <div className={styles.turn}>
          <UserMessage>{asked.question}</UserMessage>
          <AssistantMessage label={label}>
            {searched(asked.filters)}
            {asked.answer && <div className={styles.answer}>{renderAnswer(asked.answer, citeFrom(asked.sources))}</div>}
            {status === 'searching' && asked.steps.length > 0 && (
              <div className={styles.steps}>
                {asked.steps.slice(0, -1).map((s, i) => <span key={i} className={styles.stepDone}>{s}</span>)}
                <StreamStatus>{asked.steps[asked.steps.length - 1]}…</StreamStatus>
              </div>
            )}
            {status === 'searching' && asked.steps.length === 0 && <StreamStatus>Searching…</StreamStatus>}
            {status === 'writing' && <StreamStatus spinner="grow">Writing…</StreamStatus>}
            {status === 'error' && (
              <Alert variant="default" icon={null}>
                <AlertTitle>{asked.error?.code === 'nothingFound' ? 'Nothing to answer from' : 'The answer did not come through'}</AlertTitle>
                <AlertDescription>
                  {asked.error?.code === 'nothingFound'
                    ? 'The search found no records about this. Try other words, or search instead.'
                    : asked.error?.message}
                </AlertDescription>
                {!NOT_HERE.has(asked.error?.code ?? '') && (
                  <div className={styles.action}>
                    <Button variant="secondary" size="micro" iconLeft={<Refresh />} onClick={() => ask(asked.question, history.current)}>Try again</Button>
                  </div>
                )}
              </Alert>
            )}
            {status === 'limited' && asked.limit === 'budget' && (
              <Alert variant="default" icon={null}>
                <AlertTitle>No more answers today</AlertTitle>
                <AlertDescription>
                  This site has answered all the questions it can for today. Search still works, and asking is back tomorrow.
                </AlertDescription>
              </Alert>
            )}
            {status === 'limited' && asked.limit !== 'budget' && (
              <Alert variant="default" icon={null}>
                <AlertTitle>Too many questions for now</AlertTitle>
                <AlertDescription>
                  You can ask again in about {asked.retryAfterSeconds && asked.retryAfterSeconds > 90 ? `${Math.ceil(asked.retryAfterSeconds / 60)} minutes` : 'a minute'}. Search still works in the meantime.
                </AlertDescription>
              </Alert>
            )}
            {status !== 'error' && status !== 'limited' && sourceList(asked.answer, asked.sources, status === 'answered', undefined, !!asked.picks)}
            {status === 'answered' && <AnswerActions onCopy={copy} copied={copied} onFollowUp={followUpAction} />}
          </AssistantMessage>
        </div>
      )}
      </div>
      {followUps && (
        <Composer ref={composer} value={draft} onChange={setDraft} onSend={sendFollowUp} onStop={stop}
                  streaming={asked.busy} placeholder="Ask a follow-up…" aria-label="Ask a follow-up" />
      )}
    </div>
  );
};
