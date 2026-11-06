import { Chip } from '@indxsearch/systm';
import { useState } from 'react';
import { Flag, Trolley, Hour_glass, Warning, Empty, Hibernate } from '@indxsearch/pixl';
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
          <h2 className={styles.heading}>Toggle</h2>
          <p className={styles.desc}>With <code>onClick</code> a chip is a button that can be picked, as a facet's values are in the console's search preview.</p>
          <ToggleChips />
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
            <Chip size="large" color="var(--CTeal)" textColor="#080809" icon={<Flag />}>Ready</Chip>
            <Chip size="large" color="#6B9EFF" textColor="#080809" icon={<Trolley />}>Loading</Chip>
            <Chip size="large" color="#FFC107" textColor="#080809" icon={<Hour_glass />}>Indexing</Chip>
            <Chip size="large" color="var(--CSignal)" textColor="var(--lv0)" icon={<Warning />}>Error</Chip>
            <Chip size="large" icon={<Empty />}>Created</Chip>
            <Chip size="large" color="var(--CLightBlue)" textColor="#080809" icon={<Hibernate />}>Hibernated</Chip>
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

function ToggleChips() {
  const [picked, setPicked] = useState<string[]>(['Drama']);
  const toggle = (v: string) => setPicked(p => (p.includes(v) ? p.filter(x => x !== v) : [...p, v]));
  return (
    <div className={styles.row}>
      {[['Drama', 10447], ['Comedy', 8429], ['Thriller', 5574], ['Action', 4572]].map(([v, n]) => (
        <Chip key={v} selected={picked.includes(v as string)} onClick={() => toggle(v as string)}>
          {v}<span style={{ marginLeft: 6, opacity: 0.6 }}>{(n as number).toLocaleString('en')}</span>
        </Chip>
      ))}
    </div>
  );
}
