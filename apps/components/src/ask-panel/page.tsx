import type { ReactNode } from 'react';
import { AskPanel } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import { mockFetch, type AskBehaviour } from '../mock/searchOrAsk';
import { PropsTable } from '../PropsTable';
import styles from '../search-input/page.module.css';

/**
 * AskPanel: an answer to one question, written from the dataset's records by Search or ask. Each
 * state against the mock server (mock/searchOrAsk.ts); the field that asks is SearchInput's onAsk,
 * and the two together are the Search or ask composition.
 */

const QUESTION = 'how do I add synonyms to a dataset?';

function State({ title, when, ask, slow, children }: { title: string; when: ReactNode; ask?: AskBehaviour; slow?: boolean; children?: ReactNode }) {
  return (
    <>
      <div className={styles.stateLabel}>
        <div className={styles.stateTitle}>{title}</div>
        <div className={styles.stateWhen}>{when}</div>
      </div>
      <div className={styles.cell}>
        <MockSearchProvider authenticatedFetch={mockFetch(ask ?? 'answer', { slow })}>
          {children ?? <AskPanel question={QUESTION} />}
        </MockSearchProvider>
      </div>
    </>
  );
}

export default function AskPanelPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>AskPanel</h1>
        <p className={styles.desc}>
          An answer to one question, written from the dataset's records: the question, the answer as it streams
          with its citations, the sources it cites, Copy and a follow-up. It asks the server itself when given a
          question; the page decides where it goes (above the results, a side panel, a dialog). It answers from the
          records only, and says so when they do not hold the answer.
        </p>
        <PropsTable rows={[
          { name: 'question', type: 'string | null', description: 'The question to answer. A new value asks it; null or empty shows nothing. To ask the same text again, give the panel a new key.' },
          { name: 'onSourceClick', type: '(source) => void', description: 'A cited source was picked: { n, documentKey, title }. The panel reports it to the statistics; the page opens the record.' },
          { name: 'onFollowUp', type: '() => void', description: 'Shown as "Ask a follow-up" under the answer, e.g. back to the search field.' },
          { name: 'renderAnswer', type: '(answer, cite) => ReactNode', default: 'plain paragraphs', description: 'Renders the answer, for a page with its own markdown. cite(n) gives the citation mark for source n.' },
          { name: 'label', type: 'string', default: '"Answer"', description: 'The label over the answer.' },
          { name: 'onStatusChange', type: '(status) => void', description: 'idle, searching, writing, answered, error or limited, e.g. to show a Stop button elsewhere.' },
        ]} />
      </div>
      <div className={styles.grid}>
        <State title="Answered" when={<>Sources first, then the text as it streams, then the sources it cited and Copy.</>} />
        <State title="Slow model" slow when={<>The same answer from a slow model: "Searching…", then "Writing…" while it streams.</>} />
        <State title="With a follow-up" when={<><code>onFollowUp</code> given: "Ask a follow-up" under the answer.</>}>
          <AskPanel question={QUESTION} onFollowUp={() => {}} />
        </State>
        <State title="Nothing found" ask="nothingFound" when={<>The search found no records to answer from. No retry: other words, or the search, will do better.</>} />
        <State title="Failed mid-answer" ask="failed" when={<>The model stopped. What arrived stays, with Try again.</>} />
        <State title="Limited" ask="limited" when={<>Too many questions from this address, or the dataset's daily budget is spent. Says how long to wait.</>} />
      </div>
    </main>
  );
}
