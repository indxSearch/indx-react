import { useState } from 'react';
import { ScoreMeter, Slider } from '@indxsearch/systm';
import styles from './page.module.css';

const MARKS = [{ at: 0.25, label: 'Hint' }, { at: 0.4, label: 'Invitation' }, { at: 0.65, label: 'Answer offer' }];

export default function ScoreMeterPage() {
  const [value, setValue] = useState(0.39);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>ScoreMeter</h1>
        <p className={styles.desc}>
          A score from 0 to 1 as a row of small cells, the waffle's pixels in one line, lit up to the score, with a
          thin tick at each threshold that matters to it; point at a tick for its name. Compact, for a line of text.
          The Search or ask tester shows the judge's scores with it.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Against three thresholds</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-xs)', color: 'var(--lv6)' }}>
          <span>question</span><ScoreMeter value={value} marks={MARKS} aria-label="Question" /><span>{value.toFixed(2)}</span>
        </div>
        <div style={{ width: 320, marginTop: 16 }}>
          <Slider min={0} max={1} step={0.01} value={value} onChange={v => setValue(v as number)} aria-label="Score" />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
          <ScoreMeter value={0.71} marks={[{ at: 0.5, label: 'Finished' }]} />
          <ScoreMeter value={0.71} marks={[{ at: 0.5, label: 'Finished' }]} cells={10} cell={8} />
        </div>
      </div>
    </main>
  );
}
