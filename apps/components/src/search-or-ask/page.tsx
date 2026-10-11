import { useState, type ReactNode } from 'react';
import { AskPanel, SearchInput } from '@indxsearch/intrface';
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
          0.2. Strong at 0.65, invite at 0.4.
        </p>
      </div>

      <div className={styles.grid}>
        <Row title="Search, then ask" when={<>Type "fuzzy matching", then "how do I turn on fuzzy matching". Press Enter on the strong offer.</>}>
          <Together />
        </Row>
        <Row title="With a slow model" when={<>The same, with an answer that takes its time: what the visitor sees while it searches and writes.</>}>
          <Together slow />
        </Row>
      </div>
    </main>
  );
}
