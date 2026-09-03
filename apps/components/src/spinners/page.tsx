import { useState } from 'react';
import { Slider, Spinner, spinnerNames } from '@indxsearch/systm';
import styles from './page.module.css';

export default function SpinnersPage() {
  const [spinnerSize, setSpinnerSize] = useState(35);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Spinners</h1>
          <p className={styles.subtitle}>
            {spinnerNames.length} spinners from @indxsearch/systm
          </p>
        </div>

        <div className={styles.controls}>
          <label className={styles.controlLabel}>
            Spinner Size: {spinnerSize}px
          </label>
          <div className={styles.slider}>
            <Slider
              min={14}
              max={56}
              step={7}
              value={spinnerSize}
              onChange={(val) => setSpinnerSize(val as number)}
            />
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {spinnerNames.map((name) => (
          <div key={name} className={styles.iconCard}>
            <div className={styles.iconPreview}>
              <Spinner name={name} size={spinnerSize} color="var(--lv8)" />
            </div>
            <div className={styles.iconName}>{name}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
