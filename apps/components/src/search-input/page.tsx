import type { ReactNode } from 'react';
import { SearchInput } from '@indxsearch/intrface';
import { MockSearchProvider, type MockSearchProviderProps } from '../mock/MockSearchProvider';
import { mockFetch } from '../mock/searchOrAsk';
import styles from './page.module.css';

type State = {
  title: string;
  when: ReactNode;
  mock: Omit<MockSearchProviderProps, 'children'>;
};

const states: State[] = [
  {
    title: 'Empty',
    when: <>No query, no filters.</>,
    mock: {},
  },
  {
    title: 'Not empty',
    when: <>A query, results above the coverage bar. <code>query.length &gt; 0</code></>,
    mock: { initialQuery: 'pikachu', resultCount: 12, truncationIndex: 3, enableCoverage: true },
  },
  {
    title: 'Filtered',
    when: <>No query, filters set. <code>filters</code> or <code>rangeFilters</code> not empty</>,
    mock: { initialFilters: { type: ['fire', 'water'] }, initialRangeFilters: { hp: { min: 60, max: 120 } }, resultCount: 40 },
  },
  {
    title: 'Not empty and filtered',
    when: <>A query and filters.</>,
    mock: { initialQuery: 'char', initialFilters: { type: ['fire'] }, resultCount: 5, truncationIndex: 2, enableCoverage: true },
  },
  {
    title: 'Nearest',
    when: (
      <>
        Results, but none reached the coverage bar: every one is a pattern match. Coverage on, a text query,
        and <code>truncationIndex === -1</code>
      </>
    ),
    mock: { initialQuery: 'pikachoo electrik', resultCount: 18, truncationIndex: -1, enableCoverage: true },
  },
  {
    title: 'No results',
    when: <>A query and nothing back. With pattern matches off, this is also what no coverage hits looks like.</>,
    mock: { initialQuery: 'xyzzy', resultCount: 0, truncationIndex: -1, enableCoverage: true },
  },
];

const offerStates: { title: string; when: ReactNode; query: string; enabled?: boolean }[] = [
  { title: 'No offer', when: <>A lookup: the score is below 0.4, or it is an identifier, which is never sent.</>, query: 'BoostProxy' },
  { title: 'Invite', when: <>From 0.4, or one word that scores high: an answer might help.</>, query: 'synonyms in a dataset' },
  { title: 'Strong', when: <>From 0.65 and at least two words. Enter asks.</>, query: 'how do I add synonyms' },
  { title: 'Off', when: <>The dataset has it off, or the instance has no key: no offer, no requests.</>, query: 'how do I add synonyms', enabled: false },
];

export default function SearchInputPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchInput</h1>
        <p className={styles.desc}>
          The search field in intrface, in each state a search can be in. Chips say what the search is doing:
          active filters, Nearest when no result reached the coverage bar, and No results. One Clear resets the
          query and the filters together. Each row has its own mock search state; type or clear to move it.
        </p>
      </div>

      <div className={styles.grid}>

        {states.map((s) => (
          <MockSearchProvider key={s.title} {...s.mock}>
            <div className={styles.stateLabel}>
              <div className={styles.stateTitle}>{s.title}</div>
              <div className={styles.stateWhen}>{s.when}</div>
            </div>
            <div className={styles.cell}><SearchInput /></div>
          </MockSearchProvider>
        ))}
      </div>

      <div className={styles.section} style={{ marginTop: '3rem' }}>
        <h2 className={styles.heading}>With onAsk (Search or ask)</h2>
        <p className={styles.desc}>
          Given <code>onAsk</code>, and on a dataset with Search or ask switched on, the field offers to answer what
          is typed: a quiet "Ask about this", or a primary "Ask" where Enter asks. Without <code>onAsk</code> nothing
          changes and nothing is sent. The judge here is a mock (a question word scores 0.85, three words 0.5).
        </p>
      </div>
      <div className={styles.grid}>
        {offerStates.map((s) => (
          <MockSearchProvider key={s.title} initialQuery={s.query} resultCount={8} placeholderText="Type to search" authenticatedFetch={mockFetch('answer', { enabled: s.enabled ?? true })}>
            <div className={styles.stateLabel}>
              <div className={styles.stateTitle}>{s.title}</div>
              <div className={styles.stateWhen}>{s.when}</div>
            </div>
            <div className={styles.cell}><SearchInput onAsk={() => {}} /></div>
          </MockSearchProvider>
        ))}
      </div>

      <div className={styles.section} style={{ marginTop: '3rem' }}>
        <h2 className={styles.heading}>With onAsk, offer below the field</h2>
        <p className={styles.desc}>
          <code>askOffer="below"</code> moves the offer out of the chip row into a row of its own under the field,
          as on the Indx docs. A strong offer is a full-size "Ask the assistant" button with a <code>↵</code> hint;
          the quiet one stays "Ask about this". The row keeps its height while Search or ask is on, so nothing under
          it moves when an offer appears.
        </p>
      </div>
      <div className={styles.grid}>
        {offerStates.map((s) => (
          <MockSearchProvider key={s.title} initialQuery={s.query} resultCount={8} placeholderText="Type to search" authenticatedFetch={mockFetch('answer', { enabled: s.enabled ?? true })}>
            <div className={styles.stateLabel}>
              <div className={styles.stateTitle}>{s.title}</div>
              <div className={styles.stateWhen}>{s.when}</div>
            </div>
            <div className={styles.cell}><SearchInput onAsk={() => {}} askOffer="below" /></div>
          </MockSearchProvider>
        ))}
      </div>
    </main>
  );
}
