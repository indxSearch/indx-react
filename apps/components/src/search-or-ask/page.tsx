import { useState, type ReactNode } from 'react';
import { AskPanel, SearchInput } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import styles from '../search-input/page.module.css';

/**
 * Search or ask in intrface: the offer in SearchInput's chip row (onAsk) and AskPanel, against a
 * mock server. The judge here is a few rules, not Jev: a question word or a question mark scores
 * high, three or more words middling, anything else low. Not on the published site until the
 * feature ships (Notes/search-or-ask-server.md).
 */

const THRESHOLDS = { strong: 0.65, strongHide: 0.45, invite: 0.4, inviteHide: 0.3 };
const QUESTION = /^(how|what|why|where|which|who|when|can|should|does|do|is|are|hvordan|hva|hvorfor|kan)\b/i;

function mockScore(text: string): number {
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

type AskBehaviour = 'answer' | 'nothingFound' | 'limited' | 'failed';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });

/** A server that answers Search or ask's three requests, the answer streamed word by word. */
function mockFetch(ask: AskBehaviour, opts: { enabled?: boolean; slow?: boolean } = {}) {
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

function Row({ title, when, children }: { title: string; when: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className={styles.stateLabel}>
        <div className={styles.stateTitle}>{title}</div>
        <div className={styles.stateWhen}>{when}</div>
      </div>
      <div className={styles.cell}>{children}</div>
    </>
  );
}

/** A search field and the answer under it, as a page would put them. */
function Together({ ask = 'answer' as AskBehaviour, initialQuery = '', slow = false }) {
  const [question, setQuestion] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  return (
    <MockSearchProvider initialQuery={initialQuery} resultCount={initialQuery ? 8 : null} authenticatedFetch={mockFetch(ask, { slow })}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <SearchInput onAsk={q => { setQuestion(q); setRun(r => r + 1); }} />
        {question && (
          <AskPanel key={run} question={question} onSourceClick={s => alert(`Open record ${s.documentKey}: ${s.title}`)}
                    onFollowUp={() => setQuestion(null)} />
        )}
      </div>
    </MockSearchProvider>
  );
}

function PanelOnly({ ask }: { ask: AskBehaviour }) {
  return (
    <MockSearchProvider authenticatedFetch={mockFetch(ask)}>
      <AskPanel question="how do I add synonyms to a dataset?" />
    </MockSearchProvider>
  );
}

export default function SearchOrAskPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Search or ask</h1>
        <p className={styles.desc}>
          While the visitor types, the server judges whether they are asking for something an answer would
          serve. SearchInput shows the offer in its chip row when given <code>onAsk</code>: a quiet "Ask about
          this", or a primary "Ask" where Enter asks. AskPanel writes the answer from the dataset's records and
          lists the ones it cites.
        </p>
        <p className={styles.note}>
          The judge on this page is a mock: a question word or a question mark scores 0.85, three words 0.5,
          anything else 0.2. Strong at 0.65, invite at 0.4.
        </p>
      </div>

      <h2 className={styles.heading}>Try it</h2>
      <div className={styles.grid}>
        <Row title="Search, then ask" when={<>Type "fuzzy matching", then "how do I turn on fuzzy matching". Press Enter on the strong offer.</>}>
          <Together />
        </Row>
      </div>

      <h2 className={styles.heading} style={{ marginTop: '3rem' }}>The offer</h2>
      <div className={styles.grid}>
        <Row title="No offer" when={<>A lookup: p below 0.4, or an identifier, which is never sent.</>}>
          <Together initialQuery="BoostProxy" />
        </Row>
        <Row title="Invite" when={<>p from 0.4, or one word that scores high: an answer might help.</>}>
          <Together initialQuery="synonyms in a dataset" />
        </Row>
        <Row title="Strong" when={<>p from 0.65 and at least two words. Enter asks.</>}>
          <Together initialQuery="how do I add synonyms" />
        </Row>
        <Row title="Off" when={<>The dataset has it off, or the instance has no key: no offer and no requests.</>}>
          <MockSearchProvider initialQuery="how do I add synonyms" authenticatedFetch={mockFetch('answer', { enabled: false })}>
            <SearchInput onAsk={() => {}} />
          </MockSearchProvider>
        </Row>
      </div>

      <h2 className={styles.heading} style={{ marginTop: '3rem' }}>AskPanel</h2>
      <div className={styles.grid}>
        <Row title="Answered" when={<>Sources first, then the text as it streams, then the cited sources and Copy.</>}>
          <PanelOnly ask="answer" />
        </Row>
        <Row title="Nothing found" when={<>The search found no records to answer from. No retry: other words or search will do better.</>}>
          <PanelOnly ask="nothingFound" />
        </Row>
        <Row title="Failed mid-answer" when={<>The model stopped. What arrived stays, with Try again.</>}>
          <PanelOnly ask="failed" />
        </Row>
        <Row title="Limited" when={<>Too many questions from this address, or the dataset's daily budget is spent.</>}>
          <PanelOnly ask="limited" />
        </Row>
      </div>
    </main>
  );
}
