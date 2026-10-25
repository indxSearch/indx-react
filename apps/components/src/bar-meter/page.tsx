import { useEffect, useState } from 'react';
import { BarMeter, Stat, StatGroup } from '@indxsearch/systm';
import styles from './page.module.css';

const gb = (n: number) => `${n.toFixed(1)} GB`;
// A warning from 70 %, the signal red from 85 %: the zones a pressure gauge has.
const PRESSURE_ZONES = [{ from: 0.7, color: 'var(--CWarning)' }, { from: 0.85, color: 'var(--CSignal)' }];

export default function BarMeterPage() {
  // A live reading, the way a monitor would feed it: a random walk, with the odd spike.
  const [cpu, setCpu] = useState(42);
  useEffect(() => {
    const t = setInterval(() => {
      setCpu((c) => Math.min(100, Math.max(0, c + (Math.random() - 0.5) * 20 + (Math.random() < 0.05 ? 40 : 0))));
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>BarMeter</h1>
        <p className={styles.desc}>
          A level against its ceiling, as a row of bars: the filled ones in the ink, the rest dim. Where ProgressBar is
          a percentage on its way to done, this goes up and down: CPU pressure, memory in use, a quota. The bars are
          drawn by a repeating gradient, so their number follows the width.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>An instance</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <BarMeter label="CPU pressure" value={Math.round(cpu)} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" zones={PRESSURE_ZONES} />
          </div>
          <div className={styles.card}>
            <BarMeter label="Memory" value={6.2} max={16} format={gb} />
          </div>
          <div className={styles.card}>
            <BarMeter label="Documents" value={312_400} max={500_000} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Ring</h2>
        <p className={styles.desc}>
          The same bars around a circle, from the top clockwise, with the value in the middle. The size is the
          diameter: 48 is the smallest that holds a short value, and from 96 the ceiling joins it on a second line.
        </p>
        <div className={styles.rings}>
          <BarMeter shape="ring" label="CPU pressure" value={Math.round(cpu)} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" zones={PRESSURE_ZONES} />
          <BarMeter shape="ring" label="Memory" value={6.2} max={16} format={gb} maxLabel="of 16 GB" />
          <BarMeter shape="ring" label="Documents" value={312_400} max={500_000} format={(v) => `${Math.round(v / 1000)}k`} maxLabel="of 500k" />
          <BarMeter shape="ring" label="Past the threshold" value={93} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" color="var(--CSignal)" />
        </div>
        <div className={styles.rings}>
          <BarMeter shape="ring" size={48} label="48" value={30} max={100} format={(v) => `${v} %`} />
          <BarMeter shape="ring" size={72} label="72" value={50} max={100} format={(v) => `${v} %`} />
          <BarMeter shape="ring" size={96} label="96" value={70} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" />
          <BarMeter shape="ring" size={128} label="128" value={100} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a Stat</h2>
        <p className={styles.desc}>
          The 48px ring as a Stat's figure, under the Stat's label with the foot to its right: a level on a dashboard row of numbers.
        </p>
        <StatGroup columns={4}>
          <Stat label="CPU pressure" figure={<BarMeter shape="ring" size={48} value={Math.round(cpu)} max={100} format={(v) => `${v} %`} color={cpu > 85 ? 'var(--CSignal)' : undefined} />}>of 100 %</Stat>
          <Stat label="Memory" figure={<BarMeter shape="ring" size={48} value={6.2} max={16} format={(v) => `${Math.round((v / 16) * 100)} %`} />}>6.2 of 16 GB</Stat>
          <Stat label="Documents" value="312,400">of 500,000</Stat>
          <Stat label="Searches" value="14,208" />
        </StatGroup>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Segments</h2>
        <p className={styles.desc}>
          With segments the row is shares of a whole instead of a level: each segment its share of the bars in a
          tone of its own, its name and share above it, a hairline between. Where Waffle is a grid of shares, this
          is the row.
        </p>
        <div className={styles.stack} style={{ maxWidth: 520 }}>
          <BarMeter label="Searchers" segments={[{ label: 'Returning', value: 20 }, { label: 'Regular', value: 75 }, { label: 'New', value: 5 }]} />
          <BarMeter label="Fields by type" segments={[{ label: 'Text', value: 14 }, { label: 'Number', value: 6 }, { label: 'Date', value: 2 }, { label: 'Array', value: 3 }]} format={(v) => `${v}`} />
          <BarMeter label="Requests" segments={[{ label: 'Served', value: 96.4 }, { label: 'Timed out', value: 3.6, color: 'var(--CSignal)' }]} format={(v) => `${v.toFixed(1)} %`} />
          <BarMeter label="Documents by dataset, as a legend" labels="legend" segments={[{ label: 'furniture', value: 41_438 }, { label: 'tmdb23k', value: 23_439 }, { label: 'gyldendal-sanity', value: 17_087 }, { label: 'norsk skoleregister', value: 5_897 }, { label: 'Others', value: 5_387 }]} format={(v) => v.toLocaleString()} />
        </div>
        <p className={styles.desc}>
          A segment under 8 % of the row gets no head (the last one apart, it has the right edge to itself), so heads never pile up; with many or narrow segments,
          labels="legend" lists them all under the bars instead.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Zones</h2>
        <p className={styles.desc}>
          zones are levels from which the filled bars change colour: a warning from 70 %, the signal red from 85 %.
          The bars past the level show each zone faintly, so the thresholds are seen before they are reached. A
          color prop overrides them.
        </p>
        <div className={styles.rings}>
          <BarMeter shape="ring" label="Below" value={45} max={100} format={(v) => `${v} %`} zones={PRESSURE_ZONES} />
          <BarMeter shape="ring" label="Warning" value={76} max={100} format={(v) => `${v} %`} zones={PRESSURE_ZONES} />
          <BarMeter shape="ring" label="Signal" value={92} max={100} format={(v) => `${v} %`} zones={PRESSURE_ZONES} />
          <BarMeter shape="ring" size={96} label="96, at 76 %" value={76} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" zones={PRESSURE_ZONES} />
        </div>
        <div className={styles.stack}>
          <BarMeter label="Below" value={45} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" zones={PRESSURE_ZONES} />
          <BarMeter label="Warning" value={76} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" zones={PRESSURE_ZONES} />
          <BarMeter label="Signal" value={92} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" zones={PRESSURE_ZONES} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Levels</h2>
        <div className={styles.stack}>
          <BarMeter label="Empty" value={0} max={100} />
          <BarMeter label="A quarter" value={25} max={100} />
          <BarMeter label="Half" value={50} max={100} />
          <BarMeter label="Full" value={100} max={100} />
          <BarMeter label="Past the threshold" value={93} max={100} format={(v) => `${v} %`} maxLabel="of 100 %" color="var(--CSignal)" />
        </div>
      </div>
    </main>
  );
}
