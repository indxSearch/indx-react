import { useState } from 'react';
import { Chart, Tabs } from '@indxsearch/systm';
import styles from './page.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const revenue =    [42, 58, 51, 67, 79, 88, 74, 95, 102, 91, 110, 128];
const searches =   [31, 44, 39, 55, 61, 70, 58, 80,  88, 77,  90, 104];
const conversions = [8, 12, 10, 14, 18, 20, 15, 22,  26, 21,  28,  33];

export default function ChartPage() {
  const [activeType, setActiveType] = useState<'line' | 'bar'>('line');

  return (
    <main className={styles.main}>

      <div className={styles.section}>
        <h1 className={styles.title}>Chart</h1>
        <p className={styles.desc}>
          SVG-based line and bar charts. 12×12 dot grid background, sharp corners, lv color system.
          Hover to inspect values.
        </p>
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
        <p className={styles.subdesc}>Three series, default color sequence, legend shown when series &gt; 1.</p>
        <Chart
          type="line"
          labels={MONTHS}
          series={[
            { label: 'Revenue',     data: revenue },
            { label: 'Searches',    data: searches },
            { label: 'Conversions', data: conversions },
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
            { label: '2024', data: [360, 490, 450, 560] },
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
