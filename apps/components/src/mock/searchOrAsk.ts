/**
 * A mock server for Search or ask's three requests (settings, intent, ask), for the design-area
 * pages. The judge is a few rules standing in for Jev: a question word or a question mark scores
 * 0.85, three or more words 0.5, anything else 0.2. The answer streams word by word.
 */
const THRESHOLDS = { strong: 0.65, strongHide: 0.45, invite: 0.4, inviteHide: 0.3, hint: 0.31, finished: 0.5, found: 0.3 };
const QUESTION = /^(how|what|why|where|which|who|when|can|should|does|do|is|are|hvordan|hva|hvorfor|kan)\b/i;

export function mockScore(text: string): number {
  const t = text.trim();
  if (QUESTION.test(t) || t.endsWith('?')) return 0.85;
  if (t.split(/\s+/).length >= 3) return 0.5;
  return 0.2;
}

const SOURCES = [
  { n: 1, documentKey: 101, title: 'Synonyms · Adding synonyms' },
  { n: 2, documentKey: 102, title: 'Synonyms · How expansion affects scores' },
  { n: 3, documentKey: 103, title: 'Boost rules · Overview' },
];
const ANSWER =
  'Open the dataset and go to the **Synonyms** tab [1]:\n\n' +
  '1. Add a list of words that mean the same thing.\n' +
  '2. Choose `multidirectional`, or `oneWay` to expand from one word only.\n\n' +
  'Synonyms apply from the next search, with no reindex. Expansion makes the query longer, so ' +
  'Coverage scores come out a little lower *by design* [2].';

// A follow-up gets an answer that builds on the first, so a conversation reads like one.
const FOLLOW_UP =
  'Over the HTTP API, **PUT** the whole list to the dataset\'s synonyms route; it replaces what is there [1]:\n\n' +
  '```bash\n' +
  'curl -X PUT "$BASE/api/teams/my-team/datasets/docs/synonyms" \\\n' +
  '  -H "Authorization: Bearer $KEY" \\\n' +
  '  -d \'[{ "terms": ["sofa", "couch"], "direction": "multidirectional" }]\'\n' +
  '```\n\n' +
  'The console\'s Synonyms tab saves through the same route.';

export type AskBehaviour = 'answer' | 'nothingFound' | 'limited' | 'budget' | 'unavailable' | 'failed' | 'picks';

/** A catalogue's picks (AskBehaviour 'picks'): the films the assistant chose for "find queer movies". */
const PICKS = [
  { n: 1, documentKey: 258480, title: 'Carol', why: 'Two women fall in love in 1950s New York.', year: 2015 },
  { n: 2, documentKey: 376867, title: 'Moonlight', why: 'A young man in Miami comes to terms with who he loves.', year: 2016 },
  { n: 3, documentKey: 531428, title: 'Portrait of a Lady on Fire', why: 'A painter and the woman she paints fall in love.', year: 2019 },
  { n: 4, documentKey: 234200, title: 'Pride', why: 'A comedy about gay and lesbian activists in 1984.', year: 2014 },
];
const PICKS_ANSWER = 'Four films with queer lives at their heart. Carol [1] and Portrait of a Lady on Fire [3] are love stories between women, ' +
  'Moonlight [2] is about growing up, and Pride [4] is a warm comedy. The catalogue has no genre for this, so I chose them by what they are about.';

/** How the judge answers: `judge` scores the text; `paused`, the provider refuses answers, so
 *  every text is p 0 with the reason; `spent`, the dataset's calls for today are spent (429). */
export type IntentBehaviour = 'judge' | 'paused' | 'spent';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });

/** A server that answers Search or ask's three requests, the answer streamed word by word. */
/** `mode` is the dataset's Search or ask mode. In proactive a question is only sure from four
 *  words, so the answer does not start on "how d". `found` is the judge's reading of whether what
 *  is asked about is in the results (null: not said). */
export function mockFetch(ask: AskBehaviour, opts: { enabled?: boolean; slow?: boolean; mode?: 'strict' | 'soft' | 'open' | 'inviting' | 'proactive'; intent?: IntentBehaviour; found?: number | null } = {}) {
  const { enabled = true, slow = false, mode = 'soft', intent = 'judge', found = null } = opts;
  return async (url: string, init: RequestInit = {}) => {
    if (url.endsWith('/search-or-ask') && (init.method ?? 'GET') === 'GET')
      return json({ settings: { enabled, mode, thresholds: THRESHOLDS }, effective: {}, available: true });
    if (url.endsWith('/intent')) {
      const { text } = JSON.parse(String(init.body)) as { text: string };
      await new Promise(r => setTimeout(r, 120));
      if (intent === 'spent')
        return json({ code: 'searchOrAskBudgetSpent', retryAfterSeconds: 3600 }, { status: 429, headers: { 'Retry-After': '3600' } });
      if (intent === 'paused')
        return json({ p: 0, answerable: null, offer: 'none', thresholds: THRESHOLDS, cached: false, ms: 0, reason: 'paused', mode });
      const words = text.trim().split(/\s+/).length;
      const p = (mode === 'proactive' || mode === 'inviting') && words < 4 ? Math.min(mockScore(text), 0.5) : mockScore(text);
      // The mock reads a request as finished from four words, as the mock is sure of a question.
      return json({ p, answerable: null, offer: 'none', thresholds: THRESHOLDS, cached: false, ms: 120, mode, finished: words >= 4 ? 0.9 : 0.2, found });
    }
    if (url.endsWith('/documents/lookup')) {
      const keys = JSON.parse(String(init.body)) as number[];
      return json(keys.map(k => { const p = PICKS.find(x => x.documentKey === k); return { id: k, title: p?.title ?? `Record ${k}`, year: p?.year }; }));
    }
    if (url.endsWith('/ask')) {
      const followUp = (JSON.parse(String(init.body ?? '{}')).history ?? []).length > 0;
      if (ask === 'limited')
        return json({ code: 'rateLimited', retryAfterSeconds: 240 }, { status: 429, headers: { 'Retry-After': '240' } });
      if (ask === 'budget')
        return json({ code: 'searchOrAskBudgetSpent', retryAfterSeconds: 30000 }, { status: 429, headers: { 'Retry-After': '30000' } });
      if (ask === 'unavailable')
        return json({ code: 'searchOrAskUnavailable', detail: 'This instance has no model key configured (Indx:SearchOrAsk:ApiKey).' }, { status: 409 });
      const encoder = new TextEncoder();
      const signal = init.signal;
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (event: string, data: unknown) =>
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
          await wait(slow ? 1500 : 600);
          if (signal?.aborted) return controller.close();
          if (ask === 'nothingFound') {
            send('error', { code: 'nothingFound', message: 'The search found nothing to answer from.' });
            return controller.close();
          }
          if (ask === 'picks') {
            send('status', { step: 'Picked 4' });
            send('picks', { picks: PICKS.map(({ year: _, ...p }) => p), search: null });
            send('sources', PICKS.map(p => ({ n: p.n, documentKey: p.documentKey, title: p.title })));
          } else send('sources', SOURCES);
          const words = (ask === 'picks' && !followUp ? PICKS_ANSWER : followUp ? FOLLOW_UP : ANSWER).split(/(?<= )/);
          for (let i = 0; i < words.length; i++) {
            if (signal?.aborted) return controller.close();
            if (ask === 'failed' && i === 18) {
              send('error', { code: 'failed', message: 'The answer could not be written.' });
              return controller.close();
            }
            send('text', { delta: words[i] });
            await wait(slow ? 120 : 35);
          }
          send('done', { model: 'mock', latencyMs: 1200 });
          controller.close();
        },
      });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    }
    return new Response(null, { status: 404 });
  };
}

