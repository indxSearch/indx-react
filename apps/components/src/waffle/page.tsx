import { Waffle } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

const holdings = [
  { label: 'USDT', value: 35 },
  { label: 'ETH', value: 32.5 },
  { label: 'SUI', value: 20.5 },
  { label: 'UNI', value: 12 },
];

const fields = [
  { label: 'Text', value: 14 },
  { label: 'Number', value: 6 },
  { label: 'Date', value: 2 },
  { label: 'Array', value: 3 },
];

export default function WafflePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Waffle</h1>
        <p className={styles.desc}>
          Shares of a whole as a grid of pixel squares: each segment gets its share of the cells, filled column by
          column from the left, the first segment in the ink and the rest down the tone ladder, with a legend beneath.
          Where a pie would be, this is the pixel version.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Default</h2>
        <p className={styles.desc}>Twenty by five, 4px cells. A hundred cells, so a cell is a percent.</p>
        <div className={styles.stack}>
          <Waffle segments={holdings} aria-label="Portfolio by holding" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a card</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Fields by type</p>
            <Waffle segments={fields} format={(_, v) => `${v}`} />
          </div>
          <div className={styles.card}>
            <p className={styles.cardLabel}>Searches by source</p>
            <Waffle segments={[{ label: 'Website', value: 8_120 }, { label: 'App', value: 3_400 }, { label: 'API', value: 1_050 }]} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Shapes</h2>
        <div className={styles.stack}>
          <Waffle segments={holdings} columns={10} rows={10} legend={false} />
          <Waffle segments={holdings} columns={50} rows={2} cell={6} legend={false} />
          <Waffle segments={holdings} columns={25} rows={4} cell={8} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A colour</h2>
        <p className={styles.desc}>A segment can carry a colour where it means something: the signal red for the part that is a problem.</p>
        <div className={styles.stack}>
          <Waffle segments={[{ label: 'Served', value: 96.4 }, { label: 'Timed out', value: 3.6, color: 'var(--CSignal)' }]} format={(f) => `${(f * 100).toFixed(1)} %`} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'segments', type: '{ label, value, color? }[]', description: 'The shares, in order from the left. The tone ladder has four steps; a fifth segment, or one that means something, takes a colour.' },
          { name: 'columns', type: 'number', default: '20', description: 'Cells across.' },
          { name: 'rows', type: 'number', default: '5', description: 'Cells down.' },
          { name: 'cell', type: 'number', default: '4', description: 'A cell\'s side in pixels, with a 2px gap.' },
          { name: 'format', type: '(fraction, value) => ReactNode', description: 'The share in the legend; a whole percent by default.' },
          { name: 'legend', type: 'boolean', default: 'true', description: 'The legend beneath the grid.' },
          { name: 'aria-label', type: 'string', description: 'A name for assistive technology.' },
        ]} />
      </div>
    </main>
  );
}
