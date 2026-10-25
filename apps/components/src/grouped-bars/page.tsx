import { useMemo } from 'react';
import { GroupedBars } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

// A deterministic stand-in for a week of readings, so the page looks the same on every load.
function noise(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}`);

export default function GroupedBarsPage() {
  const week = useMemo(() => DAYS.map((label, d) => {
    const values = Array.from({ length: 24 }, (_, h) => {
      const office = h >= 8 && h <= 17 && d < 5 ? 1 : 0.2;
      return Math.round(240 * office * (0.5 + noise(d * 24 + h) * 0.9));
    });
    const total = values.reduce((a, b) => a + b, 0);
    return { label, values, sublabel: total.toLocaleString(), highlight: d === 5 };
  }), []);
  const weekTotal = week.reduce((a, g) => a + g.values.reduce((b, v) => b + v, 0), 0);

  const quarter = useMemo(() => Array.from({ length: 13 }, (_, w) => ({
    label: `W${35 + w}`,
    values: Array.from({ length: 7 }, (_, d) => Math.round((d < 5 ? 1600 : 500) * (0.6 + noise(w * 7 + d) * 0.8))),
    highlight: w === 12,
    color: 'var(--CTeal)',
  })), []);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>GroupedBars</h1>
        <p className={styles.desc}>
          Thin bars in labelled groups across the width: a group a day and a bar an hour, a group a week and a bar a
          day. A hairline marks where each group starts, with its name and a figure above; a band under each group
          carries its colour when it is highlighted, so one group stands out. Hover reads a bar.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A week of hours</h2>
        <p className={styles.desc}>
          Seven groups of 24 bars, the day's total above each, Saturday highlighted in the teal; the hours under the
          bands, as many as fit the width.
        </p>
        <GroupedBars
          groups={week.map((g) => ({ ...g, sublabel: `${g.sublabel} · ${Math.round((g.values.reduce((a, b) => a + b, 0) / weekTotal) * 100)} %` }))}
          labels={HOURS}
          height={120}
          format={(v) => `${v.toLocaleString()} searches`}
          aria-label="Searches by hour, this week"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A quarter of days</h2>
        <p className={styles.desc}>Thirteen weeks of seven, the current week highlighted, no figures in the heads.</p>
        <GroupedBars groups={quarter} labels={DAYS} height={80} format={(v) => v.toLocaleString()} aria-label="Searches by day, this quarter" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'groups', type: '{ label, values, sublabel?, color?, highlight? }[]', description: 'The groups in order, each a run of bars; a highlighted one in its colour, the teal by default.' },
          { name: 'labels', type: 'string[]', description: 'What each sample in a group is, for the tooltip and under the band.' },
          { name: 'height', type: 'number', default: '120', description: "The bars' height." },
          { name: 'max', type: 'number', description: 'The value that reaches the top; the largest by default.' },
          { name: 'gap', type: 'number', default: '2', description: 'The gap between groups in pixels.' },
          { name: 'format', type: '(value, group, index) => string', description: "The tooltip's text. Without it, no hover." },
          { name: 'aria-label', type: 'string', description: 'A name for assistive technology.' },
        ]} />
      </div>
    </main>
  );
}
