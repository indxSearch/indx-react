import { useState } from 'react';
import { Chart, Tabs } from '@indxsearch/systm';
import type { ChartMarker } from '@indxsearch/systm';
import styles from './page.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const revenue =    [42, 58, 51, 67, 79, 88, 74, 95, 102, 91, 110, 128];
const searches =   [31, 44, 39, 55, 61, 70, 58, 80,  88, 77,  90, 104];
const conversions = [8, 12, 10, 14, 18, 20, 15, 22,  26, 21,  28,  33];

// A month of a dataset's search statistics, shaped like the Statistics tab in IndxServer: a
// rising line with a weekly rhythm, and the selects that follow it.
const dayLabel = (d: Date) => `${d.getUTCDate()} ${d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}`;
const DAYS_30 = Array.from({ length: 30 }, (_, i) => dayLabel(new Date(Date.UTC(2026, 8, 2 + i))));
const monthSearches = DAYS_30.map((_, i) => Math.round(60 + i * 3.4 + (i % 7 >= 5 ? 28 : 0) + ((i * 37) % 11)));
const monthSelects = monthSearches.map((v, i) => Math.round(v * (0.36 + ((i * 13) % 7) / 100)));
// What the dataset's owners changed: a small square on the baseline, and the change in the tooltip.
const monthChanges: ChartMarker[] = [
  { index: 5, label: 'Boost rules: 3 → 4 rules, 3 enabled' },
  { index: 12, label: 'Synonyms: 3 → 5 entries' },
  { index: 20, label: 'Fields changed: author' },
  { index: 25, label: '1 240 documents updated by filter' },
  { index: 27, label: 'Reindexed' },
];
const DAYS_90 = Array.from({ length: 90 }, (_, i) => dayLabel(new Date(Date.UTC(2026, 6, 4 + i))));
const quarter = DAYS_90.map((_, i) => Math.round(80 + i * 1.2 + 25 * Math.sin(i / 3.5) + ((i * 29) % 13)));

export default function ChartPage() {
  const [activeType, setActiveType] = useState<'line' | 'bar'>('line');

  return (
    <main className={styles.main}>

      <div className={styles.section}>
        <h1 className={styles.title}>Chart</h1>
        <p className={styles.desc}>
          SVG-based line and bar charts. Sharp corners, lv color system, no shadows. Hover, or tap
          on a touch screen, to inspect a point; a horizontal drag moves along the line.
        </p>
      </div>

      {/* As IndxServer's Statistics tab uses it */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Statistics, with markers</h2>
        <p className={styles.subdesc}>
          The dataset Statistics tab in IndxServer: searches in the default grey, selects in{' '}
          <code>var(--CTeal)</code>, and <code>markers</code> for the changes made to the dataset. A
          marker is a small blue square on the baseline under its point, and the change is listed in
          that point's tooltip. Several markers may share a point.
        </p>
        <Chart
          type="line"
          labels={DAYS_30}
          series={[
            { label: 'Searches', data: monthSearches },
            { label: 'Selects', data: monthSelects, color: 'var(--CTeal)' },
          ]}
          markers={monthChanges}
          height={180}
        />
      </div>

      {/* Label thinning */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Many points</h2>
        <p className={styles.subdesc}>
          Ninety daily points. Labels are thinned to as many as fit side by side, counted back from
          the newest so the last point always keeps its label, and the end labels are anchored
          inwards. Point markers are drawn only where points are at least 12px apart; the hovered
          point always gets one. Narrow the window to see both adapt.
        </p>
        <Chart type="line" labels={DAYS_90} series={[{ label: 'Searches', data: quarter }]} height={160} showLegend={false} />
      </div>

      {/* Type switcher */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Line vs Bar</h2>
        <Tabs
          size="micro"
          value={activeType}
          onValueChange={(v) => setActiveType(v as 'line' | 'bar')}
          items={[{ label: 'Line', value: 'line' }, { label: 'Bar', value: 'bar' }]}
        />
        <Chart
          type={activeType}
          labels={MONTHS}
          series={[{ label: 'Revenue', data: revenue }]}
          height={180}
        />
      </div>

      {/* Multi-series line */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Multi-series Line</h2>
        <p className={styles.subdesc}>
          Three series, legend shown when series &gt; 1. A series without a <code>color</code> is
          drawn in the default grey, so give every series but one a colour of its own, or they
          cannot be told apart.
        </p>
        <Chart
          type="line"
          labels={MONTHS}
          series={[
            { label: 'Revenue',     data: revenue },
            { label: 'Searches',    data: searches, color: 'var(--CTeal)' },
            { label: 'Conversions', data: conversions, color: 'var(--CLightBlue)' },
          ]}
          height={200}
        />
      </div>

      {/* Multi-series bar */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Multi-series Bar</h2>
        <p className={styles.subdesc}>Grouped bars side by side per label.</p>
        <Chart
          type="bar"
          labels={QUARTERS}
          series={[
            { label: '2023', data: [310, 420, 390, 480] },
            { label: '2024', data: [360, 490, 450, 560], color: 'var(--CTeal)' },
          ]}
          height={180}
        />
      </div>

      {/* Custom colors */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Custom Colors</h2>
        <p className={styles.subdesc}>Pass <code>color</code> and <code>hoverColor</code> per series.</p>
        <div className={styles.row}>
          <Chart
            type="line"
            labels={DAYS}
            series={[{ label: 'Active users', data: [240, 190, 280, 310, 295, 180, 140], color: 'var(--CTeal)' }]}
            height={140}
          />
          <Chart
            type="bar"
            labels={DAYS}
            series={[{ label: 'Errors', data: [3, 1, 5, 2, 4, 0, 1], color: 'var(--CSignal)', hoverColor: '#FF7A72' }]}
            height={140}
          />
        </div>
      </div>

      {/* No labels */}
      <div className={styles.section}>
        <h2 className={styles.heading}>No Labels</h2>
        <p className={styles.subdesc}>Without x-axis labels — compact, useful for dashboards.</p>
        <div className={styles.row}>
          <Chart
            type="line"
            series={[{ label: 'Signal', data: [10, 45, 30, 60, 55, 80, 70, 90] }]}
            height={120}
            showLegend={false}
          />
          <Chart
            type="bar"
            series={[{ label: 'Volume', data: [5, 20, 15, 35, 28, 42, 38, 50] }]}
            height={120}
            showLegend={false}
          />
        </div>
      </div>

      {/* Heights */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Heights</h2>
        <div className={styles.stack}>
          <div>
            <p className={styles.label}>height=80</p>
            <Chart type="line" series={[{ label: 'Trend', data: revenue }]} height={80} showLegend={false} />
          </div>
          <div>
            <p className={styles.label}>height=160</p>
            <Chart type="line" labels={MONTHS} series={[{ label: 'Revenue', data: revenue }]} height={160} showLegend={false} />
          </div>
          <div>
            <p className={styles.label}>height=300</p>
            <Chart type="line" labels={MONTHS} series={[{ label: 'Revenue', data: revenue }]} height={300} showLegend={false} />
          </div>
        </div>
      </div>

    </main>
  );
}
