import { useMemo } from 'react';
import { RadialChart, Stat } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

// A deterministic stand-in for a year of readings, so the page looks the same on every load.
function noise(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const dayLabel = (d: Date) => `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`;

export default function RadialChartPage() {
  const year = useMemo(() => {
    const from = new Date(2025, 9, 26);
    const values: number[] = [];
    const labels: string[] = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const season = 1 + 0.5 * Math.sin((i / 365) * Math.PI * 2 - 1);
      values.push(Math.round((weekend ? 40 : 160) * season * (0.6 + noise(i) * 0.8) + (noise(i * 3) < 0.03 ? 120 : 0)));
      labels.push(dayLabel(d));
    }
    return { values, labels };
  }, []);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => Math.round((h >= 8 && h <= 17 ? 320 : 40) * (0.6 + noise(h) * 0.8))), []);
  const total = year.values.reduce((a, b) => a + b, 0);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>RadialChart</h1>
        <p className={styles.desc}>
          One series around a clock face: a bar a sample, from the top clockwise, its length the value, around a
          hollow centre. A thin guide a sample runs out to the rim, a dashed line at the top marks the start of the
          period. For a long series whose shape matters more than any one reading. Hover reads a bar by its angle.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A year of days</h2>
        <p className={styles.desc}>365 bars, the weekends low, the season a slow wave, a few spikes. The total sits in the centre.</p>
        <RadialChart
          values={year.values}
          labels={year.labels}
          size={320}
          format={(v) => `${v.toLocaleString()} searches`}
          aria-label="Searches per day, last year"
          centre={<Stat label="Searches" value={total.toLocaleString()} className={styles.centreStat} />}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>The hours of a day</h2>
        <p className={styles.desc}>24 bars, midnight at the top, in the teal; the office hours stand out.</p>
        <div className={styles.row}>
          <RadialChart
            values={hours}
            labels={hours.map((_, h) => `${h}:00`)}
            size={200}
            color="var(--CTeal)"
            format={(v) => `${v} searches`}
            aria-label="Searches by hour"
          />
          <RadialChart values={hours} size={120} format={(v) => `${v}`} />
          <RadialChart values={hours} size={72} hollow={0.3} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'values', type: 'number[]', description: 'One value a sample, from the top clockwise.' },
          { name: 'labels', type: 'string[]', description: 'What each sample is, for the tooltip.' },
          { name: 'size', type: 'number', default: '240', description: 'The diameter in pixels.' },
          { name: 'hollow', type: 'number', default: '0.4', description: "The hollow centre's share of the radius." },
          { name: 'max', type: 'number', description: 'The value that reaches the rim; the largest by default.' },
          { name: 'color', type: 'string', description: "The bars' colour; the ink by default." },
          { name: 'format', type: '(value, index) => string', description: "The tooltip's text. Without it, no hover." },
          { name: 'centre', type: 'ReactNode', description: 'What sits in the hollow centre.' },
          { name: 'aria-label', type: 'string', description: 'A name for assistive technology.' },
        ]} />
      </div>
    </main>
  );
}
