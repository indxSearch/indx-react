import { CodeCopy } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from '../search-input/page.module.css';

/** CodeCopy: a line of code with a copy button, for commands and keys a reader pastes. */

export default function CodeCopyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>CodeCopy</h1>
        <p className={styles.desc}>A piece of code with a button that copies it, for a command, a key or a URL the reader will paste.</p>
        <PropsTable rows={[
          { name: 'code', type: 'string', description: 'Required. The text shown and copied.' },
          { name: 'onCopy', type: '() => void', description: 'Called after a copy, e.g. to count it.' },
          { name: 'className', type: 'string', description: 'Extra class on the outer element.' },
        ]} />
      </div>
      <div className={styles.grid}>
        <div className={styles.stateLabel}><div className={styles.stateTitle}>A command</div></div>
        <div className={styles.cell}><CodeCopy code="npm install @indxsearch/intrface" /></div>
        <div className={styles.stateLabel}><div className={styles.stateTitle}>A URL</div></div>
        <div className={styles.cell}><CodeCopy code="https://localhost:5001/api/teams/indx-intern/datasets/pokedex/search" /></div>
        <div className={styles.stateLabel}><div className={styles.stateTitle}>Longer than the column</div><div className={styles.stateWhen}>How it wraps or scrolls.</div></div>
        <div className={styles.cell}><CodeCopy code="curl -X POST https://localhost:5001/api/teams/indx-intern/datasets/pokedex/search -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example' -d '{&quot;text&quot;:&quot;pikachu&quot;}'" /></div>
      </div>
    </main>
  );
}
