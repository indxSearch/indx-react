import { RadarChart } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

// A dataset's profile: six shares from the Statistics overview, this month against last.
const pct = (v: number) => `${v} %`;
const PROFILE = [
  { label: 'Click-through', max: 100, format: pct },
  { label: 'Fuzzy finds', max: 100, format: pct },
  { label: 'One word', max: 100, format: pct },
  { label: 'With a filter', max: 100, format: pct },
  { label: 'Settled mid-word', max: 100, format: pct },
  { label: 'Answered', max: 100, format: pct },
];
const THIS_MONTH = [41, 6, 62, 12, 38, 71];
const LAST_MONTH = [36, 9, 58, 10, 29, 64];

export default function RadarChartPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>RadarChart</h1>
        <p className={styles.desc}>
          A shape across a few dimensions: an axis a dimension, the name at its end, faint rings for the scale, and a
          series as a polygon through its value on each axis with the Chart's square markers and a faint fill. For
          comparing profiles. Hover reads the axis nearest the pointer and lists every series' value on it.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A dataset's profile, two months</h2>
        <p className={styles.desc}>
          Six shares from the Statistics overview, each axis to 100 %. This month in the ink, last month in teal
          with the checker pattern, so the two tell apart without colour alone.
        </p>
        <RadarChart
          axes={PROFILE}
          series={[
            { label: 'This month', values: THIS_MONTH },
            { label: 'Last month', values: LAST_MONTH, color: 'var(--CTeal)', fill: 'checker' },
          ]}
          size={260}
          aria-label="Dataset profile, this month and last"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>One shape, and its own units</h2>
        <p className={styles.desc}>
          A single series, solid; each axis with a max and a format of its own, since a count and a share do not
          share a scale.
        </p>
        <div className={styles.row}>
          <RadarChart
            axes={[
              { label: 'Searchable', max: 31 }, { label: 'Filterable', max: 31 }, { label: 'Facetable', max: 31 },
              { label: 'Sortable', max: 31 }, { label: 'Embeddable', max: 31 },
            ]}
            series={[{ label: 'pokedex', values: [4, 23, 6, 8, 1] }]}
            size={200}
            format={(v) => `${v} fields`}
            aria-label="Field roles of pokedex"
          />
          <RadarChart
            axes={PROFILE}
            series={[{ label: 'This month', values: THIS_MONTH, fill: 'none' }]}
            size={140}
            rings={2}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'axes', type: '{ label, max?, format? }[]', description: 'The dimensions, in order from the top clockwise; a max and a format of their own for a unit of their own.' },
          { name: 'series', type: '{ label, values, color?, fill? }[]', description: 'The shapes, a value an axis; the first the ink. fill: solid (default), hatch, dots, checker, none.' },
          { name: 'size', type: 'number', default: '240', description: 'The diameter of the rim; the names sit outside it.' },
          { name: 'max', type: 'number', description: 'The value at the rim on axes without a max of their own; the largest by default.' },
          { name: 'rings', type: 'number', default: '3', description: 'The scale rings inside the rim.' },
          { name: 'format', type: '(value) => string', description: 'A value as shown in the tooltip.' },
          { name: 'showLegend', type: 'boolean', default: 'true', description: 'The legend with several series.' },
          { name: 'aria-label', type: 'string', description: 'A name for assistive technology.' },
        ]} />
      </div>
    </main>
  );
}
