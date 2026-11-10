/**
 * Search or ask: the rules a page applies before and after the server's judgement. The server
 * judges (POST search-or-ask/intent); these decide when it is worth asking and keep the offer from
 * blinking while the visitor types. They are the rules JevProbe's replay measured
 * (JevProbe/Replay/Typing.cs and Panel.cs); keep them in step.
 */

import { Tolerance } from '@indxsearch/indx-types';

export type Offer = 'none' | 'invite' | 'strong';

/** How forward the offer is, the dataset's `mode`: `strict`, only the full offer; `soft`, the quiet
 *  one early and the full one when sure; `open`, asking always there (Enter asks whatever the
 *  judge says); `inviting`, open with the invitation sweeping as soon as the judge reads a question
 *  starting, but no answer until asked; `proactive`, inviting, and the answer written on its own
 *  once the judge is sure, reads it as finished, and the visitor has stopped. */
export type SearchOrAskMode = 'strict' | 'soft' | 'open' | 'inviting' | 'proactive';

/** The mode that applies: the page's own where it chose one, else the dataset's. Strict, soft,
 *  open and inviting only change what the page shows, so a page may choose any of them. Proactive
 *  starts answers nobody asked for, which the server allows only for a dataset set to proactive
 *  (and within its day's cap), so a page's proactive is inviting anywhere else. */
export function pageMode(dataset: SearchOrAskMode, page?: SearchOrAskMode): SearchOrAskMode {
  if (!page) return dataset;
  return page === 'proactive' && dataset !== 'proactive' ? 'inviting' : page;
}

/** Entered at one probability, left only below a lower one. The dataset's settings carry them, and
 *  each judgement its own resolved: `hint` the inviting and proactive modes' "type a bit more",
 *  low (the judge and the dataset's kind decide it unless set), `finished` the score the full offer
 *  waits for in every mode (and proactive answers on its own from), `found` the score below which
 *  the list under the full offer is dimmed (0 is off). */
export interface OfferThresholds {
  strong: number;
  strongHide: number;
  invite: number;
  inviteHide: number;
  hint?: number | null;
  finished?: number;
  found?: number;
  /** The list is refocused from this question or description score up (0, off, by default): the
   *  page's searches ask for `?refocus=true`, a search no record holds every word of ordered by the
   *  rarest words the records hold. The judgement's own `refocus` says when it is reached. */
  refocus?: number;
}

export const DEFAULT_THRESHOLDS: OfferThresholds = { strong: 0.65, strongHide: 0.45, invite: 0.4, inviteHide: 0.3, hint: 0.31, finished: 0.5, found: 0.3, refocus: 0 };

// Digits and separators (ISBN, SKU), a dotted member, camel or Pascal case, a code with a digit.
// The server applies the same rule and answers p 0 without a call; checking here saves the request.
const IDENTIFIER = /^[\d\s\-_.:/]+$|^\w+\.\w+|^[A-Za-z]*[a-z][A-Z]\w*$|^[A-Za-z]+[-_]?\d[\w-]*$/;

export function isIdentifier(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && !t.includes(' ') && IDENTIFIER.test(t);
}

/** A sentence, in any language: a question mark, or three words. No word list: the words of a
 *  question are the judge's to read (27 Oct 2026), so nothing here knows "how" from "hvordan". */
export function sentence(text: string): boolean {
  const t = text.trim();
  return !!t && !isIdentifier(t) && (t.endsWith('?') || t.split(/\s+/).length >= 3);
}

/** Whether a pause on this text may ask the server at all: a sentence, or `minChars` (4; the
 *  inviting and proactive modes ask from 3, so "How" gets its hint). */
export function triggers(text: string, minChars = 4): boolean {
  const t = text.trim();
  if (!t || isIdentifier(t)) return false;
  return sentence(t) || t.length >= minChars;
}

/** The next offer from the current one and a new probability, with hysteresis. */
export function nextOffer(current: Offer, p: number, t: OfferThresholds = DEFAULT_THRESHOLDS): Offer {
  if (p >= t.strong) return 'strong';
  if (current === 'strong' && p >= t.strongHide) return 'strong';
  if (p >= t.invite) return 'invite';
  if (current !== 'none' && p >= t.inviteHide) return 'invite';
  return 'none';
}

/** The strict matching a page's searches take while the offer to ask is strong: no typos, no starts
 *  of longer words, no joined words. The forgiving matching that is right for a typed name confirms
 *  the wrong records under a question: "ullern videregående" confirmed seven other schools by prefix
 *  and fuzzy matches of the second word (14 Oct 2026). The server's judge reads the list searched
 *  the same way. The hook puts these on the page's searches while the offer is strong and takes
 *  them off after. */
export const STRICT_MATCH = { tolerance: Tolerance.Exact, typingPrefixFrom: 0, joinedWords: false } as const;

/** One word can show a question starting ("how" scores high) but holds nothing to answer yet, so
 *  it gets the invitation at most; the strong offer waits for a second word or a question mark. */
export function canAnswer(text: string): boolean {
  const t = text.trim();
  return t.includes(' ') || t.endsWith('?');
}

/** Reads a `text/event-stream` body as `{ event, data }` messages, data parsed as JSON. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: unknown }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        let event = 'message';
        const data: string[] = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
        }
        if (data.length) yield { event, data: JSON.parse(data.join('\n')) };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** What the statistics need to place a judgement or an ask, as a search sends it: the search
 *  behind it, the page load's session, the surface, and whether it counts. */
export function statisticsParams(ctx: { state: { queryId?: string }; sessionId?: string; source?: string; count?: boolean }): string {
  const p = new URLSearchParams();
  if (ctx.state.queryId) p.set('queryId', ctx.state.queryId);
  if (ctx.sessionId) p.set('session', ctx.sessionId);
  if (ctx.source) p.set('source', ctx.source);
  if (ctx.count === false) p.set('count', 'false');
  const s = p.toString();
  return s ? `?${s}` : '';
}
