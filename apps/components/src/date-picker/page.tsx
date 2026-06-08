import { useState } from 'react';
import { DatePicker } from '@indxsearch/systm';
import styles from './page.module.css';

export default function DatePickerPage() {
  const [date, setDate] = useState<Date | null>(null);
  const [created, setCreated] = useState<Date | null>(new Date());

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>DatePicker</h1>
        <p className={styles.desc}>Single-date calendar picker in a popover, with month navigation</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Basic</h2>
        <div className={styles.column}>
          <DatePicker label="Start date" value={date} onChange={setDate} />
          <p className={styles.desc}>Selected: {date ? date.toDateString() : 'none'}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With Initial Value</h2>
        <div className={styles.column}>
          <DatePicker label="Created" value={created} onChange={setCreated} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Custom Format</h2>
        <div className={styles.column}>
          <DatePicker
            label="Formatted"
            value={created}
            onChange={setCreated}
            formatDate={(d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Error / Disabled</h2>
        <div className={styles.column}>
          <DatePicker label="Required" error="Please pick a date" />
          <DatePicker label="Disabled" disabled />
        </div>
      </div>
    </main>
  );
}
