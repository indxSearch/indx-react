/**
 * A mock server for Search or ask's three requests (settings, intent, ask), for the design-area
 * pages. The judge is a few rules standing in for Jev: a question word or a question mark scores
 * 0.85, three or more words 0.5, anything else 0.2. The answer streams word by word.
 */
const THRESHOLDS = { strong: 0.65, strongHide: 0.45, invite: 0.4, inviteHide: 0.3 };
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
  'Open the dataset and go to the Synonyms tab. Add a list of words that mean the same thing; ' +
  'a search for any of them then also finds the others [1].\n\n' +
  'Synonyms apply from the next search, with no reindex. Expansion makes the query longer, so ' +
  'Coverage scores come out a little lower by design [2].';

export type AskBehaviour = 'answer' | 'nothingFound' | 'limited' | 'failed';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });

/** A server that answers Search or ask's three requests, the answer streamed word by word. */
export function mockFetch(ask: AskBehaviour, opts: { enabled?: boolean; slow?: boolean } = {}) {
  const { enabled = true, slow = false } = opts;
  return async (url: string, init: RequestInit = {}) => {
    if (url.endsWith('/search-or-ask') && (init.method ?? 'GET') === 'GET')
      return json({ settings: { enabled, thresholds: THRESHOLDS }, effective: {}, available: true });
    if (url.endsWith('/intent')) {
      const { text } = JSON.parse(String(init.body)) as { text: string };
      await new Promise(r => setTimeout(r, 120));
      return json({ p: mockScore(text), answerable: null, offer: 'none', thresholds: THRESHOLDS, cached: false, ms: 120 });
    }
    if (url.endsWith('/ask')) {
      if (ask === 'limited')
        return json({ code: 'rateLimited', retryAfterSeconds: 240 }, { status: 429, headers: { 'Retry-After': '240' } });
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
          send('sources', SOURCES);
          const words = ANSWER.split(/(?<= )/);
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

