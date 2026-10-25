import { useState } from 'react';
import { Chart, SegmentedControl, Button } from '@indxsearch/systm';
import { Graph, Analytics, Search, Sliders_horizontal } from '@indxsearch/pixl';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const searches = [31, 44, 39, 55, 61, 70, 58, 80, 88, 77, 90, 104];
const PERIODS = ['1D', '1W', '1M', '1Y'].map((p) => ({ value: p, label: p }));

export default function SegmentedControlPage() {
  const [period, setPeriod] = useState('1M');
  const [chart, setChart] = useState<'line' | 'bar'>('line');
  const [view, setView] = useState('search');
  const [size, setSize] = useState('micro');

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SegmentedControl</h1>
        <p className={styles.desc}>
          One choice from a few, side by side: the chosen cell filled like a primary Button, the rest on the faint
          surface tone and touching. The button Tabs look with no gap, without the navigation. For the period of a
          chart, the interval of a graph, the type of a view: a compact control for a panel's header, where Tabs
          would be too tall and a Select hides the options. Arrow keys move between cells.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a panel header</h2>
        <div className={styles.card}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>Searches</span>
            <div className={styles.panelTools}>
              <SegmentedControl
                aria-label="Chart type"
                value={chart}
                onChange={setChart}
                items={[
                  { value: 'line', icon: <Graph size={14} color="currentColor" />, 'aria-label': 'Line' },
                  { value: 'bar', icon: <Analytics size={14} color="currentColor" />, 'aria-label': 'Bar' },
                ]}
              />
              <SegmentedControl aria-label="Period" value={period} onChange={setPeriod} items={PERIODS} />
            </div>
          </div>
          <Chart type={chart} labels={MONTHS} series={[{ label: 'Searches', data: searches, fill: 'solid' }]} height={160} showLegend={false} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Words and icons</h2>
        <p className={styles.desc}>A cell is a word, an icon, or both. An icon-only cell takes an aria-label.</p>
        <div className={styles.row}>
          <SegmentedControl
            aria-label="View"
            value={view}
            onChange={setView}
            items={[
              { value: 'search', label: 'Search', icon: <Search size={14} color="currentColor" /> },
              { value: 'tune', label: 'Tune', icon: <Sliders_horizontal size={14} color="currentColor" /> },
              { value: 'log', label: 'Log', disabled: true },
            ]}
          />
          <SegmentedControl
            aria-label="Findings shown"
            value={view === 'archive' ? 'archive' : 'open'}
            onChange={(v) => setView(v)}
            items={[
              { value: 'open', label: 'Open', badge: 3, badgeTone: 'info' },
              { value: 'archive', label: 'Archive' },
            ]}
          />
        </div>
        <p className={styles.desc}>A badge after the label, as on a Tab: a count that asks for attention in the signal red, or information in the info blue.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Sizes</h2>
        <p className={styles.desc}>micro is 24px tall, for a panel header; default 30px, the height of a micro Tab.</p>
        <div className={styles.row}>
          <SegmentedControl aria-label="Size" size="micro" value={size} onChange={setSize} items={[{ value: 'micro', label: 'Micro' }, { value: 'default', label: 'Default' }]} />
          <SegmentedControl aria-label="Size" size="default" value={size} onChange={setSize} items={[{ value: 'micro', label: 'Micro' }, { value: 'default', label: 'Default' }]} />
          <Button variant="secondary" size="micro">A micro button</Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Stretched</h2>
        <p className={styles.desc}>With stretch the cells share the width equally and the control fills its container.</p>
        <div style={{ maxWidth: 360 }}>
          <SegmentedControl aria-label="Period" stretch value={period} onChange={setPeriod} items={PERIODS} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled</h2>
        <div className={styles.row}>
          <SegmentedControl aria-label="Period" disabled value="1M" onChange={() => {}} items={PERIODS} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'items', type: '{ value, label?, icon?, aria-label?, disabled?, badge?, badgeTone? }[]', description: 'The cells, in order. A badge is a count after the label, signal red or info blue.' },
          { name: 'value', type: 'string', description: 'The chosen cell.' },
          { name: 'onChange', type: '(value) => void', description: 'Called with the cell chosen by click or arrow key.' },
          { name: 'size', type: "'micro' | 'default'", default: "'micro'", description: '24px or 30px tall.' },
          { name: 'stretch', type: 'boolean', default: 'false', description: 'Cells share the width equally.' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'The whole control.' },
          { name: 'aria-label', type: 'string', description: 'What the choice is.' },
        ]} />
      </div>
    </main>
  );
}
