import { Resizable } from '@indxsearch/systm';
import styles from './page.module.css';

export default function ResizablePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Resizable</h1>
        <p className={styles.desc}>
          Two panes with a handle between them that the reader drags: a list beside its detail, a canvas beside the records
          it counts. The first pane's share is a percentage between minSize and maxSize; with the handle focused, the arrows
          move it a step, Home and End to the limits. storageKey keeps the viewer's size.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Side by side, kept</h2>
        <div className={styles.frame}>
          <Resizable defaultSize={35} minSize={20} maxSize={70} storageKey="systm-showcase-resizable"
                     first={<div className={styles.pane}>List</div>} second={<div className={styles.pane}>Detail</div>} />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>One over the other, with a grip</h2>
        <div className={styles.frame}>
          <Resizable direction="vertical" withHandle
                     first={<div className={styles.pane}>Canvas</div>} second={<div className={styles.pane}>Records</div>} />
        </div>
      </div>
    </main>
  );
}
