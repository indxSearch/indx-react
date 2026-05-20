import { FilterPanelSkeleton } from '@indxsearch/intrface';
import styles from './page.module.css';

export default function FilterPanelSkeletonPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>FilterPanelSkeleton</h1>
        <p className={styles.desc}>
          Placeholder shown in filter panels while <code>isFetchingInitial</code> is true.
          Prevents layout collapse while waiting for the first search response.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.demo}>
          <h2 className={styles.heading}>List — 5 rows (default)</h2>
          <FilterPanelSkeleton title="Pokemon Type" />
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>List — 3 rows</h2>
          <FilterPanelSkeleton title="Rarity" rows={3} />
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>List — 8 rows</h2>
          <FilterPanelSkeleton title="Abilities" rows={8} />
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>Slider variant</h2>
          <FilterPanelSkeleton title="HP" variant="slider" />
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>Slider — starts collapsed</h2>
          <FilterPanelSkeleton title="Attack" variant="slider" startCollapsed />
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>List — starts collapsed</h2>
          <FilterPanelSkeleton title="Speed" rows={5} startCollapsed />
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>No title</h2>
          <FilterPanelSkeleton rows={4} collapsible={false} />
        </div>
      </div>
    </main>
  );
}
