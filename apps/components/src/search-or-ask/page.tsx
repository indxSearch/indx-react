import { useState, type ReactNode } from 'react';
import { AskPanel, QuickAnswer, SearchInput, SearchResults, useSearchOrAsk } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import { mockFetch, type AskBehaviour, type IntentBehaviour } from '../mock/searchOrAsk';
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

/** The field, and the list under it dimmed when the judge reads the answer as not in it. */
function WithResults({ onAsk }: { onAsk: (q: string, how?: { proactive: boolean }) => void }) {
  const sor = useSearchOrAsk();
  return (
    <>
      <SearchInput searchOrAsk={sor} onAsk={onAsk} />
      <SearchResults searchOrAsk={sor} resultsPerPage={3}>
        {(_, { result }) => <div style={{ padding: '6px 0', font: 'var(--text-sm)' }}>Result {result.position}</div>}
      </SearchResults>
    </>
  );
}

function Together({ ask = 'answer' as AskBehaviour, initialQuery = '', slow = false, askOffer = 'chip' as 'chip' | 'below' | 'quick' | 'results', mode = 'soft' as Mode,
  intent = 'judge' as IntentBehaviour, found = null as number | null }) {
  const [question, setQuestion] = useState<string | null>(null);
  const [proactive, setProactive] = useState(false);
  const [run, setRun] = useState(0);
  const onAsk = (q: string, how?: { proactive: boolean }) => { setQuestion(q); setProactive(!!how?.proactive); setRun(r => r + 1); };
  return (
    <MockSearchProvider placeholderText="Type to search" initialQuery={initialQuery} resultCount={initialQuery || askOffer === 'results' ? 8 : null} authenticatedFetch={mockFetch(ask, { slow, mode, intent, found })}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        {askOffer === 'quick' ? <WithQuickAnswer onAsk={onAsk} />
          : askOffer === 'results' ? <WithResults onAsk={onAsk} />
          : <SearchInput askOffer={askOffer} onAsk={onAsk} />}
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
        <Row title="Mode: soft" when={<>The default. "how do I add" gets the quiet "Ask about this" on its way, which a click asks and Enter does not; "how do I add synonyms" the full offer, which Enter asks.</>}>
          <Together mode="soft" />
        </Row>
        <Row title="Mode: open" when={<>Asking is always there: type "synonyms" and Ask is in the field, and Enter asks whatever the judge says.</>}>
          <Together mode="open" />
        </Row>
        <Row title="Mode: open, QuickAnswer" when={<>The same as a row above the results: type "synonyms", which the judge has nothing to say about, and the row still offers a quiet Ask, with Enter.</>}>
          <Together mode="open" askOffer="quick" />
        </Row>
        <Row title="Mode: inviting, in the chip" when={<>Type "How": the hint sweeps in the chip row, and Ask is there for anything typed, as in open. Nothing is answered unasked.</>}>
          <Together mode="inviting" />
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
        <Row title="The answer is not in the list" when={<>Type "how do I add synonyms": under the full offer the judge reads what is asked about as not in the results (<code>found</code> 0.1, below the dataset's 0.3), so SearchResults dims the list with a line above it. The list is never cut.</>}>
          <Together askOffer="results" found={0.1} />
        </Row>
        <Row title="Offers paused" when={<>Mode open, while the model provider refuses answers (the judgement's reason <code>paused</code>): no Ask, no hint, and Enter searches. The offers come back on their own.</>}>
          <Together mode="open" intent="paused" />
        </Row>
        <Row title="Today's calls spent" when={<>Mode inviting, once the dataset's calls for today are spent (429 <code>searchOrAskBudgetSpent</code>): the offer goes until midnight UTC, the search works as before.</>}>
          <Together mode="inviting" intent="spent" />
        </Row>
        <Row title="Offer below the field" when={<><code>askOffer="below"</code>: the offer in a row of its own under the field, as on the Indx docs. A strong offer is a full-size button and an Enter hint; the row keeps its height, so nothing under it moves.</>}>
          <Together askOffer="below" />
        </Row>
      </div>
    </main>
  );
}
