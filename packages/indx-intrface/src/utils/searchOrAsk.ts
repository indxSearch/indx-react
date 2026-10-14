/**
 * Search or ask: the rules a page applies before and after the server's judgement. The server
 * judges (POST search-or-ask/intent); these decide when it is worth asking and keep the offer from
 * blinking while the visitor types. They are the rules JevProbe's replay measured
 * (JevProbe/Replay/Typing.cs and Panel.cs); keep them in step.
 */

export type Offer = 'none' | 'invite' | 'strong';

/** Entered at one probability, left only below a lower one. The dataset's settings carry them. */
export interface OfferThresholds {
  strong: number;
  strongHide: number;
  invite: number;
  inviteHide: number;
}

export const DEFAULT_THRESHOLDS: OfferThresholds = { strong: 0.65, strongHide: 0.45, invite: 0.4, inviteHide: 0.3 };

const QUESTION_WORDS = new Set([
  'hvordan', 'hva', 'hvorfor', 'hvor', 'hvilken', 'hvilke', 'hvilket', 'hvem', 'når', 'kan', 'skal', 'må', 'bør',
  'er', 'går', 'finnes', 'trenger',
  'how', 'what', 'why', 'where', 'which', 'who', 'when', 'can', 'should', 'does', 'do', 'is', 'are', 'will', 'could', 'would',
]);

// Digits and separators (ISBN, SKU), a dotted member, camel or Pascal case, a code with a digit.
// The server applies the same rule and answers p 0 without a call; checking here saves the request.
const IDENTIFIER = /^[\d\s\-_.:/]+$|^\w+\.\w+|^[A-Za-z]*[a-z][A-Z]\w*$|^[A-Za-z]+[-_]?\d[\w-]*$/;

export function isIdentifier(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && !t.includes(' ') && IDENTIFIER.test(t);
}

/** Whether a pause on this text may ask the server at all. */
export function triggers(text: string): boolean {
  const t = text.trim();
  if (!t || isIdentifier(t)) return false;
  const words = t.split(/\s+/);
  if (t.endsWith('?')) return true;
  if (words.length > 1 && QUESTION_WORDS.has(words[0]!.toLowerCase())) return true;
  if (words.length >= 3) return true;
  return t.length >= 4;
}

/** The next offer from the current one and a new probability, with hysteresis. */
export function nextOffer(current: Offer, p: number, t: OfferThresholds = DEFAULT_THRESHOLDS): Offer {
  if (p >= t.strong) return 'strong';
  if (current === 'strong' && p >= t.strongHide) return 'strong';
  if (p >= t.invite) return 'invite';
  if (current !== 'none' && p >= t.inviteHide) return 'invite';
  return 'none';
}

/** One word can show a question starting ("how" scores high) but holds nothing to answer yet, so
 *  it gets the invitation at most; the strong offer waits for a second word or a question mark. */
/**
 * The results a page shows under the "coverage hits only while asking" rule (the dataset's
 * `cutWhileAsking`, on by default): while the offer is strong, the list up to the truncation
 * point, which is where coverage's confirmed matches end and the pattern matches begin; with
 * nothing confirmed, nothing, and the offer stands alone. Otherwise the list as it came.
 */
export function visibleResults<T>(results: T[], truncationIndex: number | undefined, cut: boolean): T[] {
  if (!cut) return results;
  if (truncationIndex == null || truncationIndex < 0) return results;
  return results.slice(0, truncationIndex);
}

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
