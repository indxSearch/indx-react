import { Chip } from '@indxsearch/systm';
import { Flag, Trolley, Hour_glass, Warning } from '@indxsearch/pixl';
import styles from './page.module.css';

export default function ChipPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Chip</h1>
        <p className={styles.desc}>Pill-shaped label for categories, states, and attributes.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.demo}>
          <h2 className={styles.heading}>Default</h2>
          <div className={styles.row}>
            <Chip>fire</Chip>
            <Chip>flying</Chip>
            <Chip>water</Chip>
            <Chip>grass</Chip>
            <Chip>electric</Chip>
          </div>
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>Inline with text</h2>
          <div className={styles.textRow}>
            Abilities: <Chip>blaze</Chip><Chip>solar-power</Chip>
          </div>
          <div className={styles.textRow}>
            Stats: <Chip>HP: 78</Chip><Chip>Speed: 100</Chip><Chip>Attack: 84</Chip>
          </div>
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>System states</h2>
          <div className={styles.row}>
            <Chip color="var(--CTeal)" textColor="#080809" icon={<Flag />}>Ready</Chip>
            <Chip color="#6B9EFF" textColor="#080809" icon={<Trolley />}>Loading</Chip>
            <Chip color="#FFC107" textColor="#080809" icon={<Hour_glass />}>Indexing</Chip>
            <Chip color="var(--CSignal)" textColor="var(--lv0)" icon={<Warning />}>Error</Chip>
            <Chip>Created</Chip>
            <Chip>Hibernated</Chip>
          </div>
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>Emphasis</h2>
          <div className={styles.row}>
            <Chip color="var(--lv8)" textColor="var(--lv0)">Owner</Chip>
            <Chip color="var(--lv8)" textColor="var(--lv0)">Shadow indexing</Chip>
            <Chip color="var(--CTeal)" textColor="#080809">Active</Chip>
            <Chip color="var(--lv3)" textColor="var(--lv5)">Revoked</Chip>
            <Chip color="var(--lv3)" textColor="var(--lv5)">Expired</Chip>
          </div>
        </div>
      </div>
    </main>
  );
}
