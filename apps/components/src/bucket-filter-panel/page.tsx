import '@indxsearch/intrface/styles.css';
import { BucketFilterPanel, ActiveFiltersPanel } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import styles from './page.module.css';

export default function BucketFilterPanelPage() {
  return (
    <MockSearchProvider>
      <main className={styles.main}>
        <div className={styles.section}>
          <h1 className={styles.title}>BucketFilterPanel</h1>
          <p className={styles.desc}>
            A numeric field grouped into ranges the user can tick, several at once. Each bucket is a
            range filter; buckets on one field OR together. Counts are summed from the field's facet values.
          </p>
          <p className={styles.note}>
            The mock provider holds the selection but runs no search, so counts stay at their unfiltered values.
          </p>
        </div>

        <div className={styles.section}>
          <ActiveFiltersPanel />
        </div>

        <div className={styles.grid}>
          <div className={styles.demo}>
            <h2 className={styles.heading}>Equal width: <code>width={'{20}'}</code></h2>
            <BucketFilterPanel label="Speed" field="speed" width={20} />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Lower edges: <code>width={'{[1, 21, 41, 81, 121, 201]}'}</code></h2>
            <BucketFilterPanel label="Speed" field="speed" width={[1, 21, 41, 81, 121, 201]} />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Named, open-ended buckets</h2>
            <BucketFilterPanel
              label="HP"
              field="hp"
              buckets={[
                { label: 'Fragile', max: 45 },
                { label: 'Sturdy', min: 46, max: 105 },
                { label: 'Tank', min: 106 },
              ]}
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Buttons in a grid</h2>
            <BucketFilterPanel label="Attack" field="attack" width={50} control="button" layout="grid" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Without counts</h2>
            <BucketFilterPanel label="Attack" field="attack" width={50} showCount={false} />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Empty bucket kept, disabled: <code>showEmpty</code></h2>
            <BucketFilterPanel
              label="HP"
              field="hp"
              showEmpty
              buckets={[
                { label: '0 to 9 (none)', max: 9 },
                { label: '10 to 99', min: 10, max: 99 },
                { label: '100 and up', min: 100 },
              ]}
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Single-select: <code>control="radio"</code></h2>
            <BucketFilterPanel label="Speed" field="speed" width={40} control="radio" showActivePanel />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Limited: <code>limit={'{3}'}</code></h2>
            <BucketFilterPanel label="Speed" field="speed" width={20} limit={3} />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Starts collapsed</h2>
            <BucketFilterPanel label="Speed" field="speed" width={40} startCollapsed />
          </div>
        </div>

        <div className={styles.section} style={{ marginTop: '3rem' }}>
          <h2 className={styles.title} style={{ fontSize: '1.25rem' }}>Skeleton loading</h2>
          <p className={styles.desc}>Shown during <code>isFetchingInitial</code>, before the first search result arrives.</p>
        </div>

        <div className={styles.grid}>
          <MockSearchProvider isFetchingInitial={true}>
            <div className={styles.demo}>
              <h2 className={styles.heading}>Default</h2>
              <BucketFilterPanel label="Speed" field="speed" width={20} />
            </div>
          </MockSearchProvider>
        </div>
      </main>
    </MockSearchProvider>
  );
}
