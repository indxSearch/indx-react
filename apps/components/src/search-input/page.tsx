import type { ReactNode } from 'react';
import { SearchInput } from '@indxsearch/intrface';
import { MockSearchProvider, type MockSearchProviderProps } from '../mock/MockSearchProvider';
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
    </main>
  );
}
