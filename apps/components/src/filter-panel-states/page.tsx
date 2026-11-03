import type { ReactNode } from 'react';
import { ValueFilterPanel, RangeFilterPanel, BucketFilterPanel, describeSearchError } from '@indxsearch/intrface';
import { MockSearchProvider, type MockSearchProviderProps } from '../mock/MockSearchProvider';
import styles from './page.module.css';

type Row = {
  title: string;
  when: ReactNode;
  mock: Omit<MockSearchProviderProps, 'children'>;
};

const rows: Row[] = [
  {
    title: 'Loading',
    when: <>Fields and facets are still being read.</>,
    mock: { isFetchingInitial: true },
  },
  {
    title: 'Ready',
    when: <>The field has the roles the panel needs.</>,
    mock: {},
  },
  {
    title: 'Field not set up',
    when: <>The field is not Filterable (or, for the value panel, not Facetable). Said quietly in the panel; the console says what to do.</>,
    mock: { filterableFields: ['rarity'], facetableFields: ['rarity'] },
  },
  {
    title: 'Search failed to start',
    when: <>Server down, key rejected, dataset missing. The panels step aside: SearchResults explains it once.</>,
    mock: { authErrorInfo: describeSearchError(new TypeError('Failed to fetch'), { team: 'mock', dataset: 'pokemon' }) },
  },
];

export default function FilterPanelStatesPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Filter panel states</h1>
        <p className={styles.desc}>
          The value, range and bucket panels in each state they can be in before they show their filter.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.colHead} />
        <div className={styles.colHead}>ValueFilterPanel</div>
        <div className={styles.colHead}>RangeFilterPanel</div>
        <div className={styles.colHead}>BucketFilterPanel</div>

        {rows.map((r) => (
          <MockSearchProvider key={r.title} {...r.mock}>
            <div className={styles.label}>
              <div className={styles.labelTitle}>{r.title}</div>
              <div className={styles.labelWhen}>{r.when}</div>
            </div>
            <div className={styles.cell}><ValueFilterPanel label="Type" field="type" /></div>
            <div className={styles.cell}><RangeFilterPanel label="HP" field="hp" control="slider" /></div>
            <div className={styles.cell}><BucketFilterPanel label="Speed" field="speed" width={50} /></div>
          </MockSearchProvider>
        ))}
      </div>
    </main>
  );
}
