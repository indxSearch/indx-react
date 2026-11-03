import { useState, type ReactNode } from 'react';
import { AskPanel, QuickAnswer, SearchInput, useSearchOrAsk } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import { mockFetch, type AskBehaviour } from '../mock/searchOrAsk';
import styles from '../search-input/page.module.css';

/**
 * Search or ask in intrface: the offer in SearchInput's chip row (onAsk) and AskPanel, against a
 * mock server. The judge here is a few rules, not Jev: a question word or a question mark scores
 * high, three or more words middling, anything else low. Not on the published site until the
 * feature ships (Notes/search-or-ask-server.md).
 */


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
type Mode = 'strict' | 'soft' | 'open' | 'inviting' | 'proactive';

/** The field with QuickAnswer above where the results would be: one surface for the offer. */
function WithQuickAnswer({ onAsk }: { onAsk: (q: string, how?: { proactive: boolean }) => void }) {
  const sor = useSearchOrAsk();
  return (
    <>
      <SearchInput askOffer="none" searchOrAsk={sor} onAsk={onAsk} />
      <QuickAnswer searchOrAsk={sor} onAsk={onAsk} />
    </>
  );
}

function Together({ ask = 'answer' as AskBehaviour, initialQuery = '', slow = false, askOffer = 'chip' as 'chip' | 'below' | 'quick', mode = 'soft' as Mode }) {
  const [question, setQuestion] = useState<string | null>(null);
  const [proactive, setProactive] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <MockSearchProvider placeholderText="Type to search" initialQuery={initialQuery} resultCount={initialQuery ? 8 : null} authenticatedFetch={mockFetch(ask, { slow, mode })}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        {askOffer === 'quick'
          ? <WithQuickAnswer onAsk={(q, how) => { setQuestion(q); setProactive(!!how?.proactive); setRun(r => r + 1); }} />
          : <SearchInput askOffer={askOffer} onAsk={(q, how) => { setQuestion(q); setProactive(!!how?.proactive); setRun(r => r + 1); }} />}
        {question && (
          <AskPanel key={run} question={question} proactive={proactive} followUps
                    onSourceClick={s => alert(`Open record ${s.documentKey}: ${s.title}`)} />
        )}
      </div>
    </MockSearchProvider>
  );
}

export default function SearchOrAskPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Search or ask</h1>
        <p className={styles.desc}>
          SearchInput with <code>onAsk</code> and AskPanel together, as a page would put them. While the visitor
          types, the server judges whether they are asking for something an answer would serve; the offer shows in
          the field's chip row, and the answer above the results. The offer's states are on the SearchInput page,
          the answer's on the AskPanel page.
        </p>
        <p className={styles.note}>
          The judge here is a mock: a question word or a question mark scores 0.85, three words 0.5, anything else
          0.2. Strong at 0.65, invite at 0.4. A row that names no mode runs the dataset's default, soft: the quiet
          offer early, the full one when sure.
        </p>
      </div>

      <div className={styles.grid}>
        <Row title="Search, then ask" when={<>Type "fuzzy matching", then "how do I turn on fuzzy matching". Press Enter on the strong offer.</>}>
          <Together />
        </Row>
        <Row title="With a slow model" when={<>The same, with an answer that takes its time: what the visitor sees while it searches and writes.</>}>
          <Together slow />
        </Row>
        <Row title="Mode: strict" when={<>Only the full offer, once the judge is sure. "how do I add" shows nothing on its way; a question word shows Ask.</>}>
          <Together mode="strict" />
        </Row>
        <Row title="Mode: open" when={<>Asking is always there: type "synonyms" and Ask is in the field, and Enter asks whatever the judge says.</>}>
          <Together mode="open" />
        </Row>
        <Row title="Mode: inviting, QuickAnswer" when={<>Type "How": "For a quick answer, type a bit more" sweeps in the row as soon as the judge reads a question starting. Go on to "how do I add synonyms": the full offer, which Enter or a click asks. Nothing is answered unasked.</>}>
          <Together mode="inviting" askOffer="quick" />
        </Row>
        <Row title="Mode: proactive, QuickAnswer" when={<>Type "How", then "how do I add synonyms" and stop: Thinking sweeps, with no button, and a second later the answer starts on its own. In this mock a question is sure from four words.</>}>
          <Together mode="proactive" askOffer="quick" />
        </Row>
        <Row title="Mode: proactive, in the chip" when={<>The same in the field's chip row: the hint, then Thinking, never the full Ask button.</>}>
          <Together mode="proactive" />
        </Row>
        <Row title="Offer below the field" when={<><code>askOffer="below"</code>: the offer in a row of its own under the field, as on the Indx docs. A strong offer is a full-size button and an Enter hint; the row keeps its height, so nothing under it moves.</>}>
          <Together askOffer="below" />
        </Row>
      </div>
    </main>
  );
}
