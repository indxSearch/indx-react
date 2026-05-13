import { useState, useRef } from 'react';
import { ProgressBar, Button } from '@indxsearch/systm';
import styles from './page.module.css';

export default function ProgressBarPage() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  function startIndexing() {
    if (running) return;
    setProgress(0);
    setRunning(true);

    const duration = 3000;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const next = Math.min(100, (elapsed / duration) * 100);
      setProgress(next);
      if (next < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>ProgressBar</h1>
        <p className={styles.desc}>Progress indicator with checkerboard pattern background and optional percentage label</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Simulation</h2>
        <div className={styles.sim}>
          <ProgressBar value={progress} showLabel fulfilledColor />
          <Button variant="secondary" size="micro" onClick={startIndexing} disabled={running}>
            {running ? 'Indexing...' : 'Start Indexing'}
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Without Label</h2>
        <ProgressBar value={progress} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Static Values</h2>
        <div className={styles.stack}>
          <ProgressBar value={0} showLabel />
          <ProgressBar value={25} showLabel />
          <ProgressBar value={50} showLabel />
          <ProgressBar value={75} showLabel />
          <ProgressBar value={100} showLabel />
        </div>
      </div>
    </main>
  );
}
