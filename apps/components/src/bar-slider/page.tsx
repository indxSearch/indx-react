import { BarSlider } from '@indxsearch/systm';
import { useState } from 'react';
import styles from './page.module.css';

const weights = ['Thin', 'Light', 'Regular', 'Medium', 'Semibold', 'Bold', 'Black'];

export default function BarSliderPage() {
  const [size, setSize] = useState(537);
  const [weight, setWeight] = useState(400);
  const [slant, setSlant] = useState(0);
  const [depth, setDepth] = useState(500);
  const [micro, setMicro] = useState(3);
  const [named, setNamed] = useState(2);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>BarSlider</h1>
        <p className={styles.desc}>
          A slider that is its own row: the fill spans the full height, the label sits inside and the value at the
          right. Sized like a Button, so it stacks with fields.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A stack of settings</h2>
        <div className={styles.stack}>
          <BarSlider label="Size" min={100} max={1000} value={size} onChange={setSize} />
          <BarSlider label="Weight" min={100} max={900} step={100} stepMarks value={weight} onChange={setWeight} />
          <BarSlider label="Slant" min={-12} max={0} step={1} stepMarks value={slant} onChange={setSlant} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Formatted value</h2>
        <div className={styles.stack}>
          <BarSlider
            label="Coverage depth"
            min={100}
            max={5000}
            step={100}
            value={depth}
            onChange={setDepth}
            format={(v) => `${v.toLocaleString()} records`}
          />
          <BarSlider
            label="Weight"
            min={0}
            max={weights.length - 1}
            step={1}
            stepMarks
            value={named}
            onChange={setNamed}
            format={(v) => weights[v]}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Micro</h2>
        <div className={styles.stack}>
          <BarSlider size="micro" label="Rows" min={1} max={10} step={1} stepMarks value={micro} onChange={setMicro} />
          <BarSlider size="micro" label="Opacity" min={0} max={100} value={size / 10} onChange={(v) => setSize(v * 10)} format={(v) => `${Math.round(v)} %`} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Without the value</h2>
        <div className={styles.stack}>
          <BarSlider label="Volume" min={0} max={100} value={size / 10} onChange={(v) => setSize(v * 10)} showValue={false} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled</h2>
        <div className={styles.stack}>
          <BarSlider label="Weight" min={100} max={900} step={100} stepMarks value={400} onChange={() => {}} disabled />
        </div>
      </div>
    </main>
  );
}
