import '@indxsearch/intrface/styles.css';
import { RangeFilterPanel } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import styles from './page.module.css';

export default function RangeFilterPanelPage() {
  return (
    <MockSearchProvider>
      <main className={styles.main}>
        <div className={styles.section}>
          <h1 className={styles.title}>RangeFilterPanel</h1>
          <p className={styles.desc}>Numeric range filter with slider, inputs, and optional histogram</p>
        </div>

        <div className={styles.grid}>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Slider — default</h2>
            <RangeFilterPanel
              label="HP"
              field="hp"
              displayType="slider"
              expectedMin={0}
              expectedMax={255}
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Slider + histogram (~20 bars)</h2>
            <RangeFilterPanel
              label="HP"
              field="hp"
              displayType="slider"
              expectedMin={0}
              expectedMax={255}
              showHistogram
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Histogram — coarse resolution (50)</h2>
            <RangeFilterPanel
              label="Attack"
              field="attack"
              displayType="slider"
              expectedMin={0}
              expectedMax={190}
              showHistogram
              resolution={50}
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Histogram — fine resolution (10)</h2>
            <RangeFilterPanel
              label="Speed"
              field="speed"
              displayType="slider"
              expectedMin={0}
              expectedMax={200}
              showHistogram
              resolution={10}
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Input only (no histogram)</h2>
            <RangeFilterPanel
              label="Defense"
              field="defense"
              displayType="input"
              expectedMin={0}
              expectedMax={230}
            />
          </div>

          <div className={styles.demo}>
            <h2 className={styles.heading}>Collapsible + starts collapsed</h2>
            <RangeFilterPanel
              label="HP"
              field="hp"
              displayType="slider"
              expectedMin={0}
              expectedMax={255}
              showHistogram
              collapsible
              startCollapsed
            />
          </div>

        </div>
      </main>
    </MockSearchProvider>
  );
}
