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
/** The cut's two lines, the dataset's (`cutShareOfTop`, `cutTopFloor`), as the intent answer carries them. */
export interface CutRule {
  /** A result stays while it scores at least this share of the top result. */
  shareOfTop: number;
  /** The list shows at all only when the top result scores at least this share of the scale. */
  topFloor: number;
}

export const DEFAULT_CUT: CutRule = { shareOfTop: 0.5, topFloor: 0.2 };

/** The search score's scale: coverage scores run to 65535. */
export const SCORE_SCALE = 65535;

/**
 * The results a page shows under the "strong matches only while asking" rule (the dataset's
 * `cutWhileAsking`, on by default). While the offer is strong: nothing when the top result is
 * under the floor (a flat, weak list says the search has nothing for a question), else the
 * results scoring at least the share of the top, never past the truncation point. Otherwise the
 * list as it came. The truncation index alone was too lenient: coverage confirms a record on a
 * two-letter word, so "is" and "or" confirmed forty-four Pokémon (14 Oct 2026).
 */
export function visibleResults<T extends { score: number }>(results: T[], truncationIndex: number | undefined, cut: boolean, rule: CutRule = DEFAULT_CUT): T[] {
  if (!cut || results.length === 0) return results;
  const top = results[0].score;
  if (top < rule.topFloor * SCORE_SCALE) return [];
  const confirmed = truncationIndex == null || truncationIndex < 0 ? results : results.slice(0, truncationIndex);
  const line = rule.shareOfTop * top;
  const end = confirmed.findIndex(r => r.score < line);
  return end < 0 ? confirmed : confirmed.slice(0, end);
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
