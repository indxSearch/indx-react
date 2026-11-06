import { SliderField } from '@indxsearch/systm';
import { useState } from 'react';
import styles from './page.module.css';

export default function SliderFieldPage() {
  const [weight, setWeight] = useState(1.3);
  const [heavy, setHeavy] = useState(5);
  const [share, setShare] = useState(40);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SliderField</h1>
        <p className={styles.desc}>
          A slider and the number it holds. The slider moves in its steps between min and max; the number takes any
          value in its own range, typed or stepped with the arrow keys, and the slider follows as far as it reaches.
          The number is a ghost field: no stroke until it is edited, a ghost button's tint when pointed at.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A field's weight</h2>
        <p className={styles.desc}>Quarter steps from 0.5 to 3 on the slider, any weight from 0 in the number, 0.1 a key.</p>
        <div className={styles.stack} style={{ width: 220 }}>
          <SliderField aria-label="Weight: title" min={0.5} max={3} step={0.25} fieldMin={0} fieldStep={0.1}
            format={oneDecimalAtLeast}
            value={weight} onChange={setWeight} />
          <SliderField aria-label="Weight: heavy" min={0.5} max={3} step={0.25} fieldMin={0} fieldStep={0.1}
            format={oneDecimalAtLeast} value={heavy} onChange={setHeavy} />
        </div>
        <p className={styles.valueDisplay}>The second holds 5, past the slider's end: the slider rests at 3.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Bounded</h2>
        <div className={styles.stack} style={{ width: 220 }}>
          <SliderField aria-label="Share" min={0} max={100} step={5} fieldMin={0} fieldMax={100} fieldStep={1}
            value={share} onChange={setShare} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled</h2>
        <div className={styles.stack} style={{ width: 220 }}>
          <SliderField aria-label="Weight: locked" min={0.5} max={3} step={0.25} value={1.5} onChange={() => {}} disabled />
        </div>
      </div>
    </main>
  );
}

// 1 as 1.0 and 1.25 as it is, as the console writes a weight.
function oneDecimalAtLeast(v: number) {
  const s = String(Math.round(v * 1000) / 1000);
  return s.includes('.') ? s : `${s}.0`;
}
