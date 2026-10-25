import { BarMeter, Chip, Stat, StatGroup } from '@indxsearch/systm';
import { ArrowUp, Status, Check, Key, Cloud } from '@indxsearch/pixl';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

export default function StatPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Stat</h1>
        <p className={styles.desc}>
          One number with its label, on the Base surface: a count, a KPI, a state. Put several in a StatGroup, which
          fits as many as there is room for, or a set number that steps down on narrower screens.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>As many as fit</h2>
        <StatGroup>
          <Stat label="State" value={<Chip icon={<Status />} color="var(--CTeal)" textColor="#080809">Ready</Chip>} />
          <Stat label="Documents" value="801" />
          <Stat label="Records on disk" value="801" />
          <Stat label="Seconds to index" value="0.04s" />
        </StatGroup>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Five across, with hints</h2>
        <p className={styles.desc}>
          <code>columns={'{5}'}</code>: three under 1100px, two on a phone with the last one across. A hint goes on
          the label, which gets a dotted underline.
        </p>
        <StatGroup columns={5}>
          <Stat label="Searches" value="94" hint="Every search with text in the window, keystrokes collapsed." />
          <Stat label="Fuzzy finds" value="3" hint="Searches with typos too large for an exact match, where the visitor still chose a result." />
          <Stat label="Click-through" value="11.7 %" hint="Share of searches that ended in a chosen result." />
          <Stat label="Avg. click position" value="2.0" hint="Mean position of the chosen result." />
          <Stat label="Conversions" value="0" hint="Conversions the storefront reported." />
        </StatGroup>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A state with an icon</h2>
        <p className={styles.desc}>
          <code>icon</code> puts a pixl icon before the value, in the value's colour. A good state is the plain ink:
          the icon says it. <code>color</code> is for the one that is wrong, in the signal red. The icon is drawn at
          28, a multiple of the pixl grid's 7 cells, so its cells stay whole pixels; 14, 21, 28 and 35 are the sizes
          that do.
        </p>
        <StatGroup columns={5}>
          <Stat label="Service" value="Up" icon={<Check />}><span>4 min · build 0a23004e</span></Stat>
          <Stat label="Model" value="Key set" icon={<Key />}><span>claude-opus-5-5</span></Stat>
          <Stat label="Licence portal" value="Reachable" icon={<Cloud />}><span>license.indx.co</span></Stat>
          <Stat label="Licence portal" value="Unreachable" icon={<Cloud />} color="var(--CSignal)"><span>last tried 2 min ago</span></Stat>
          <Stat label="Database" value="92 kB"><span>26 asks kept</span></Stat>
        </StatGroup>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: 16, color: 'var(--lv7)' }}>
          {[14, 21, 28, 35].map((size) => (
            <span key={size} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, font: 'var(--text-xs)', color: 'var(--lv5)' }}>
              <Check size={size} color="var(--lv7)" />
              {size}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With a foot line</h2>
        <StatGroup columns={3}>
          <Stat label="Searches" value="12,480" hint="Every search request in the period.">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--lv6)' }}><ArrowUp size={12} color="currentColor" />8%</span>
            <span>vs previous period</span>
          </Stat>
          <Stat label="Unique searches" value="3,912"><span>vs previous period</span></Stat>
          <Stat label="Click rate" value="41 %"><span>vs previous period</span></Stat>
        </StatGroup>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With a figure</h2>
        <p className={styles.desc}>A graphic under the label carries the number; the foot sits to its right.</p>
        <StatGroup columns={3}>
          <Stat label="CPU pressure" figure={<BarMeter shape="ring" size={48} value={64} max={100} format={(v) => `${v} %`} />}>of 100 %</Stat>
          <Stat label="Memory" figure={<BarMeter shape="ring" size={48} value={39} max={100} format={(v) => `${v} %`} />}>6.2 of 16 GB</Stat>
          <Stat label="Disk" figure={<BarMeter shape="ring" size={48} value={93} max={100} format={(v) => `${v} %`} color="var(--CSignal)" />}>186 of 200 GB</Stat>
        </StatGroup>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'label', type: 'ReactNode', description: 'What the number is.' },
          { name: 'value', type: 'ReactNode', description: 'The number, formatted; or a chip, for a state. Left out when the figure carries it.' },
          { name: 'figure', type: 'ReactNode', description: 'A graphic under the label, the value and foot beside it: a BarMeter ring.' },
          { name: 'icon', type: 'ReactElement', description: 'A pixl icon before the value, drawn at 28 in the value\'s colour.' },
          { name: 'color', type: 'string', description: 'The value\'s colour, and the icon\'s: the signal red for a state that is wrong. A good state stays in the ink.' },
          { name: 'hint', type: 'string', description: 'A tooltip on the label, which gets a dotted underline.' },
          { name: 'children', type: 'ReactNode', description: 'A line under the value: a change, a unit, a note.' },
        ]} />
        <h2 className={styles.heading} style={{ marginTop: 24 }}>StatGroup</h2>
        <PropsTable rows={[
          { name: 'columns', type: 'number', description: 'How many across on a wide screen. Without it, as many as fit at 180px each.' },
        ]} />
      </div>
    </main>
  );
}
