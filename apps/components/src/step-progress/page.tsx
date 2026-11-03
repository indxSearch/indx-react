import { useState } from 'react';
import { Button, StepProgress } from '@indxsearch/systm';
import styles from './page.module.css';

// StepProgress: progress through steps in parts, each part a bar as wide as its share of the steps
// and filled by its own steps done. A part of one step is a plain stepper.
export default function StepProgressPage() {
  const [done, setDone] = useState(2);
  const groups = [3, 2, 2];
  let left = done;
  const parts = groups.map((max, i) => {
    const value = Math.min(left, max);
    left -= value;
    return { label: ['Set up your search', 'Put it to work', 'Answer and observe'][i], value, max };
  });
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>StepProgress</h1>
        <p className={styles.desc}>
          Progress through steps in parts: a thin bar per part, as wide as its share of the steps and filled by how many of
          its own are done. The row says how far along the whole is, each bar how far along its part. Where ProgressBar is
          one quantity on its way to done and BarMeter a level that goes up and down, this is a checklist's state.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Nested: Get started</h2>
        <div className={styles.card}>
          <StepProgress parts={parts} labels />
          <div className={styles.row}>
            <Button variant="secondary" size="micro" onClick={() => setDone(d => Math.max(0, d - 1))}>Back a step</Button>
            <Button variant="secondary" size="micro" onClick={() => setDone(d => Math.min(7, d + 1))}>Do a step</Button>
            <span className={styles.note}>{done} of 7 done</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>A plain stepper</h2>
        <p className={styles.desc}>Parts of one step each: the first-run setup's "two more steps", in teal there.</p>
        <div className={styles.card}>
          <StepProgress parts={[{ value: 1 }, { value: 0 }]} color="var(--CTeal)" />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Small and unweighted</h2>
        <p className={styles.desc}>All parts as wide, 22px across, for a folded side column.</p>
        <div className={styles.small}><StepProgress parts={parts} weighted={false} height={2} /></div>
      </div>
    </main>
  );
}
