import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext';
import { readSse, statisticsParams } from '../utils/searchOrAsk';

/** A record the answer may use, numbered as the answer cites it ([n]). */
export interface AskSource {
  n: number;
  documentKey: number;
  title: string;
}

/** An earlier question and its answer, sent with a follow-up so the answer can build on it. */
export interface AskTurn {
  question: string;
  answer: string;
  /** On a catalogue, the list that turn put on the page: a follow-up is about it. */
  shown?: { filters: AskFilters['filters']; text: string; sort?: AskFilters['sort'] };
}

export type AskStatus = 'idle' | 'searching' | 'writing' | 'answered' | 'error' | 'limited';

export interface AskState {
  question: string;
  status: AskStatus;
  /** The answer as written so far, citing sources as [n]. */
  answer: string;
  sources: AskSource[];
  /** Why it failed, when status is 'error': the server's code (nothingFound, upstreamBusy, failed,
   *  or an HTTP problem code) and a sentence for the page. */
  error?: { code: string; message: string };
  /** When status is 'limited': seconds until asking again may succeed. */
  retryAfterSeconds?: number;
  /** The server's id for this ask (Indx-Ask-Id). A source opened is reported against it. */
  askId?: string;
  /** On a catalogue, a description's filters, as the server searched with them, and what it found. */
  filters?: AskFilters;
  /** What the agent has done so far ("Searching: Folkehøyskole, by Elevtall"), while it works. */
  steps: string[];
}

/** What a catalogue's description was searched with: filters, words no filter covers, and the count. */
export interface AskFilters {
  filters: { field: string; value?: string | null; min?: number | null; max?: number | null }[];
  text: string;
  /** An order the description asked for ("the largest"): a Sortable field. */
  sort?: { field: string; descending: boolean } | null;
  found: number;
  /** True when the count is a cap: there are more. */
  more: boolean;
}

const IDLE: AskState = { question: '', status: 'idle', answer: '', sources: [], steps: [] };

/**
 * Asks the dataset a question (`search-or-ask/ask`) and follows the answer as it streams: the
 * sources first, then the text, then done. One question at a time; asking again, or `stop`, ends
 * the one in flight and keeps what had arrived. The answer uses the dataset's records and nothing
 * else, and says so when they do not hold it.
 */
export function useAsk() {
  const ctx = useSearchContext();
  const { url, team, dataset, authenticatedFetch } = ctx;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const [state, setState] = useState<AskState>(IDLE);
  const stateRef = useRef(state);
  stateRef.current = state;
  const abortRef = useRef<AbortController | null>(null);

  // `proactive`: the page started this answer on its own (the proactive mode), not the visitor.
  const ask = useCallback(async (question: string, history: AskTurn[] = [], options: { proactive?: boolean } = {}) => {
    const q = question.trim();
    if (!q) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ question: q, status: 'searching', answer: '', sources: [], steps: [] });

    // Text arrives faster than frames; one update per frame keeps the layout from re-flowing
    // several times between paints.
    let answer = '';
    let frame: number | null = null;
    const flush = () => {
      frame = null;
      const snapshot = answer;
      setState(s => (s.answer === snapshot ? s : { ...s, answer: snapshot }));
    };
    const settle = () => {
      if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
      flush();
    };
    const fail = (code: string, message: string) => setState(s => ({ ...s, status: 'error', error: { code, message } }));

    try {
      const res = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/search-or-ask/ask${statisticsParams(ctxRef.current)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ question: q, ...(history.length ? { history } : {}), ...(options.proactive ? { proactive: true } : {}) }),
        signal: controller.signal,
      });
      if (res.status === 429) {
        const body = await res.json().catch(() => ({})) as { retryAfterSeconds?: number };
        const header = Number(res.headers.get('Retry-After'));
        setState(s => ({ ...s, status: 'limited', retryAfterSeconds: body.retryAfterSeconds ?? (Number.isFinite(header) ? header : undefined) }));
        return;
      }
      const askId = res.headers.get('Indx-Ask-Id') ?? undefined;
      if (askId) setState(s => ({ ...s, askId }));
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({})) as { code?: string; detail?: string };
        fail(body.code ?? `http${res.status}`, body.detail ?? 'The question could not be asked.');
        return;
      }

      for await (const { event, data } of readSse(res.body)) {
        switch (event) {
          case 'status': {
            const step = (data as { step?: string }).step;
            if (step) setState(s => ({ ...s, steps: [...s.steps, step] }));
            break;
          }
          case 'filters':
            setState(s => ({ ...s, filters: data as AskFilters }));
            break;
          case 'sources':
            setState(s => ({ ...s, status: 'writing', sources: data as AskSource[] }));
            break;
          case 'text':
            answer += (data as { delta: string }).delta;
            frame ??= requestAnimationFrame(flush);
            break;
          case 'done':
            settle();
            setState(s => ({ ...s, status: 'answered' }));
            return;
          case 'error': {
            settle();
            const e = data as { code: string; message: string };
            fail(e.code, e.message);
            return;
          }
        }
      }
      settle();
      if (!controller.signal.aborted) fail('dropped', 'The connection dropped while the answer was being written.');
    } catch (err) {
      if (abortRef.current !== controller) return; // asked again: the new question owns the state
      settle();
      if ((err as Error).name === 'AbortError') {
        // Stopped: keep what arrived.
        setState(s => (s.answer ? { ...s, status: 'answered' } : { ...s, status: 'idle' }));
      } else {
        fail('dropped', 'The connection dropped while the answer was being written.');
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [url, team, dataset, authenticatedFetch]);

  /** Reports that the visitor opened a cited source: a select naming this ask, with the citation
   *  number as the position. Fire and forget, like selectResult: statistics never break a page. */
  const openSource = useCallback(async (source: AskSource, ofAsk?: string) => {
    const askId = ofAsk ?? stateRef.current.askId;
    if (!askId) return;
    try {
      await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/events/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: askId, documentKey: source.documentKey, position: source.n,
          ...(ctxRef.current.count === false ? { count: false } : {}),
        }),
      });
    } catch {
      // Not recorded; nothing else changes.
    }
  }, [url, team, dataset, authenticatedFetch]);

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => { abortRef.current?.abort(); setState(IDLE); }, []);

  // Abandon a request in flight when the page goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { ...state, ask, stop, reset, openSource, busy: state.status === 'searching' || state.status === 'writing' };
}
