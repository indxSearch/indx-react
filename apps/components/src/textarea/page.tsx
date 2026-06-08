import { Textarea } from '@indxsearch/systm';
import styles from './page.module.css';

export default function TextareaPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Textarea</h1>
        <p className={styles.desc}>Multi-line text input with label, error states, and validation</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Basic</h2>
        <div className={styles.column}>
          <Textarea placeholder="Enter a longer message..." />
          <Textarea label="Description" placeholder="Describe your dataset..." rows={5} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With Value</h2>
        <div className={styles.column}>
          <Textarea label="Notes" defaultValue={'Line one\nLine two\nLine three'} rows={4} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Error State</h2>
        <div className={styles.column}>
          <Textarea label="Required field" error="This field is required" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled</h2>
        <div className={styles.column}>
          <Textarea label="Disabled" defaultValue="Cannot edit this" disabled />
        </div>
      </div>
    </main>
  );
}
