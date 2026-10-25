import { useEffect, useState } from 'react';
import { BarMeter } from '@indxsearch/systm';
import styles from './page.module.css';

const gb = (n: number) => `${n.toFixed(1)} GB`;

export default function BarMeterPage() {
  // A live reading, the way a monitor would feed it: a random walk, with the odd spike.
  const [cpu, setCpu] = useState(42);
  useEffect(() => {
    const t = setInterval(() => {
      setCpu((c) => Math.min(100, Math.max(0, c + (Math.random() - 0.5) * 20 + (Math.random() < 0.05 ? 40 : 0))));
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>BarMeter</h1>
        <p className={styles.desc}>
          A level against its ceiling, as a row of bars: the filled ones in the ink, the rest dim. Where ProgressBar is
          a percentage on its way to done, this goes up and down: CPU pressure, memory in use, a quota. The bars are
          drawn by a repeating gradient, so their number follows the width.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>An instance</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <BarMeter label="CPU pressure" value={Math.round(cpu)} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" color={cpu > 85 ? 'var(--CSignal)' : undefined} />
          </div>
          <div className={styles.card}>
            <BarMeter label="Memory" value={6.2} max={16} format={gb} />
          </div>
          <div className={styles.card}>
            <BarMeter label="Documents" value={312_400} max={500_000} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Levels</h2>
        <div className={styles.stack}>
          <BarMeter label="Empty" value={0} max={100} />
          <BarMeter label="A quarter" value={25} max={100} />
          <BarMeter label="Half" value={50} max={100} />
          <BarMeter label="Full" value={100} max={100} />
          <BarMeter label="Past the threshold" value={93} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" color="var(--CSignal)" />
        </div>
      </div>
    </main>
  );
}
