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
  const asks = useMemo(() => hours.map((v, h) => Math.round(v * (0.08 + noise(h * 5) * 0.1))), [hours]);
  const kinds = [
    { label: 'Lookups', value: 1240 }, { label: 'Questions', value: 380 }, { label: 'Browsing', value: 910 },
    { label: 'Filters', value: 560 }, { label: 'Fuzzy finds', value: 140 }, { label: 'Zero hits', value: 60 },
  ];
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
        <h2 className={styles.heading}>Inverse, a dial</h2>
        <p className={styles.desc}>
          The bars hung from the rim, growing inward over the ticks, with the reading in the centre: a dial. The
          hours of a day again, and a level with its value in the middle.
        </p>
        <div className={styles.row}>
          <RadialChart
            values={hours}
            labels={hours.map((_, h) => `${h}:00`)}
            size={200}
            inverse
            hollow={0.55}
            format={(v) => `${v} searches`}
            aria-label="Searches by hour"
            centre={<Stat label="Busiest" value="12:00" className={styles.centreStat} />}
          />
          <RadialChart
            values={Array.from({ length: 60 }, (_, i) => (i < 28 ? 1 : 0))}
            size={200}
            inverse
            hollow={0.62}
            max={1}
            centre={<Stat label="Extraction" value="46 %" className={styles.centreStat} />}
            aria-label="Extraction 46 percent"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Two series</h2>
        <p className={styles.desc}>Searches and asks by hour: the sample's slot is shared between the series, each in its colour, with a legend; the tooltip lists both.</p>
        <RadialChart
          series={[{ label: 'Searches', values: hours }, { label: 'Asks', values: asks, color: 'var(--CTeal)' }]}
          labels={hours.map((_, h) => `${h}:00`)}
          size={240}
          format={(v) => v.toLocaleString()}
          aria-label="Searches and asks by hour"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Groups, the rose</h2>
        <p className={styles.desc}>
          A wedge per group, its radius the group's value, over a dim wedge the full radius; the number and the name
          upright in it. A handful of kinds compared. Past twelve groups, or under 200px, the names go to the tooltip.
        </p>
        <div className={styles.row}>
          <RadialChart groups={kinds} size={320} hollow={0.18} format={(v) => v.toLocaleString()} aria-label="Searches by kind" />
          <RadialChart groups={kinds} size={120} hollow={0.2} format={(v) => v.toLocaleString()} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'values', type: 'number[]', description: 'One series: a value a sample, from the top clockwise.' },
          { name: 'series', type: '{ label, values, color? }[]', description: 'Several series over the same samples; the first is the ink.' },
          { name: 'groups', type: '{ label, value, color? }[]', description: 'The rose: a wedge a group, its radius the value, with its name and value in it.' },
          { name: 'gap', type: 'number', default: '4', description: "The gap between the rose's wedges, in pixels, the same at the hollow and the rim." },
          { name: 'rounding', type: 'number', default: '8', description: "The rose's corner radius in pixels." },
          { name: 'showLegend', type: 'boolean', default: 'true', description: 'The legend under several series.' },
          { name: 'labels', type: 'string[]', description: 'What each sample is, for the tooltip.' },
          { name: 'size', type: 'number', default: '240', description: 'The diameter in pixels.' },
          { name: 'hollow', type: 'number', default: '0.4', description: "The hollow centre's share of the radius." },
          { name: 'inverse', type: 'boolean', default: 'false', description: 'Bars hung from the rim, growing inward: a dial.' },
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
