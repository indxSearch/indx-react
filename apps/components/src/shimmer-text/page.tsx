import { useState } from 'react';
import { ShimmerText, Button } from '@indxsearch/systm';
import styles from './page.module.css';

export default function ShimmerTextPage() {
  const [active, setActive] = useState(true);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>ShimmerText</h1>
        <p className={styles.desc}>
          Text a highlight sweeps across, left to right, as Notion's quick answer has it: for a line that says
          something is about to happen. The one motion in systm that runs before anything is computing: it invites.
          Search or ask's proactive mode draws its invitation and its Thinking with it. Still under reduced motion.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Lines</h2>
        <div className={styles.row}><ShimmerText active={active}>For a quick answer, type a bit more</ShimmerText></div>
        <div className={styles.row}><ShimmerText active={active}>Thinking</ShimmerText></div>
        <div className={styles.row}>
          <Button variant="ghost" size="micro" onClick={() => setActive(a => !a)}>{active ? 'Still' : 'Sweep'}</Button>
        </div>
      </div>
    </main>
  );
}
