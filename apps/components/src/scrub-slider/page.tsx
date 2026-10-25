import { ScrubSlider } from '@indxsearch/systm';
import { useState } from 'react';
import styles from './page.module.css';

export default function ScrubSliderPage() {
  const [threshold, setThreshold] = useState(154);
  const [diffusion, setDiffusion] = useState(41);
  const [intensity, setIntensity] = useState(64);
  const [offset, setOffset] = useState(0);
  const [gain, setGain] = useState(1.5);
  const [last, setLast] = useState<number | null>(null);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>ScrubSlider</h1>
        <p className={styles.desc}>
          A slider with no end. A ruler of ticks scrolls under a fixed handle: drag it as far as you like, one step
          per tick, Shift and the arrow keys for ten. The number field at the right shows the value and takes one
          typed. For quantities with no natural range, where a bar from min to max would have to invent one.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Without bounds</h2>
        <div className={styles.stack}>
          <ScrubSlider labelWidth="80px" label="Threshold" value={threshold} onChange={setThreshold} />
          <ScrubSlider labelWidth="80px" label="Offset" value={offset} onChange={setOffset} step={5} />
          <ScrubSlider labelWidth="80px" label="Gain" value={gain} onChange={setGain} step={0.1} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With bounds</h2>
        <p className={styles.desc}>
          Given <code>min</code> or <code>max</code> the value stops there, and Home and End jump to them.
        </p>
        <div className={styles.stack}>
          <ScrubSlider labelWidth="80px" label="Diffusion" value={diffusion} onChange={setDiffusion} min={0} max={100} />
          <ScrubSlider
            label="Intensity"
            value={intensity}
            onChange={setIntensity}
            onFinalChange={setLast}
            min={0}
            max={255}
          />
        </div>
        <p className={styles.valueDisplay}>Intensity last committed: {last ?? 'nothing yet'}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled</h2>
        <div className={styles.stack}>
          <ScrubSlider labelWidth="80px" label="Threshold" value={154} onChange={() => {}} disabled />
        </div>
      </div>
    </main>
  );
}
