import { SortByPanel } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import styles from './page.module.css';

export default function SortByPanelPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SortByPanel</h1>
        <p className={styles.desc}>Sort options panel as a select or radio buttons</p>
      </div>

      <div className={styles.grid}>
        <MockSearchProvider>
          <div className={styles.demo}>
            <h2 className={styles.heading}>Select</h2>
            <SortByPanel control="select" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Radio buttons</h2>
            <SortByPanel control="radio" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Collapsible + starts collapsed</h2>
            <SortByPanel control="select" collapsible startCollapsed />
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
            <h2 className={styles.heading}>Select skeleton</h2>
            <SortByPanel control="select" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Radio skeleton</h2>
            <SortByPanel control="radio" />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Starts collapsed</h2>
            <SortByPanel control="select" startCollapsed />
          </div>
        </MockSearchProvider>
      </div>
    </main>
  );
}
