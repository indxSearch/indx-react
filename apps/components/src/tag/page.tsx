import { Tag } from '@indxsearch/systm';
import styles from './page.module.css';

export default function TagPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Tag</h1>
        <p className={styles.desc}>Pill-shaped label for categories, types, and attributes.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.demo}>
          <h2 className={styles.heading}>Default</h2>
          <div className={styles.row}>
            <Tag>fire</Tag>
            <Tag>flying</Tag>
            <Tag>water</Tag>
            <Tag>grass</Tag>
            <Tag>electric</Tag>
          </div>
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>Inline with text</h2>
          <div className={styles.textRow}>
            Abilities: <Tag>blaze</Tag><Tag>solar-power</Tag>
          </div>
          <div className={styles.textRow}>
            Stats: <Tag>HP: 78</Tag><Tag>Speed: 100</Tag><Tag>Attack: 84</Tag>
          </div>
        </div>
      </div>
    </main>
  );
}
