import { Chip, Stat, StatGroup } from '@indxsearch/systm';
import { ArrowUp, Status } from '@indxsearch/pixl';
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
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'label', type: 'ReactNode', description: 'What the number is.' },
          { name: 'value', type: 'ReactNode', description: 'The number, formatted; or a chip, for a state.' },
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
