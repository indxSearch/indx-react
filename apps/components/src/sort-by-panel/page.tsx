import { SortByPanel } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import styles from './page.module.css';

export default function SortByPanelPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SortByPanel</h1>
        <p className={styles.desc}>Sort options panel with dropdown or radio buttons</p>
      </div>

      <div className={styles.grid}>
        <MockSearchProvider>
          <div className={styles.demo}>
            <h2 className={styles.heading}>Dropdown</h2>
            <SortByPanel displayType="dropdown" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Radio buttons</h2>
            <SortByPanel displayType="radio" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Collapsible + starts collapsed</h2>
            <SortByPanel displayType="dropdown" collapsible startCollapsed />
          </div>
        </MockSearchProvider>
      </div>

      <div className={styles.section} style={{ marginTop: '3rem' }}>
        <h2 className={styles.title} style={{ fontSize: '1.25rem' }}>Skeleton loading</h2>
        <p className={styles.desc}>Shown during <code>isFetchingInitial</code> — before the first search result arrives.</p>
      </div>

      <div className={styles.grid}>
        <MockSearchProvider isFetchingInitial={true}>
          <div className={styles.demo}>
            <h2 className={styles.heading}>Dropdown skeleton</h2>
            <SortByPanel displayType="dropdown" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Radio skeleton</h2>
            <SortByPanel displayType="radio" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Starts collapsed</h2>
            <SortByPanel displayType="dropdown" startCollapsed />
          </div>
        </MockSearchProvider>
      </div>
    </main>
  );
}
