import { useState } from 'react';
import { Base, Button, Skeleton } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

const widths = [62, 48, 75, 55, 68];

export default function SkeletonPage() {
  const [run, setRun] = useState(0);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Skeleton</h1>
        <p className={styles.desc}>
          A placeholder for content that is on its way: a bar or block that pulses slowly. Besides Spinner it is the
          one thing in systm that moves, because the visitor is waiting. It waits 0.15s before it shows, so an answer
          that comes quickly never flashes a skeleton, and with reduced motion it holds a steady tone.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Lines, staggered</h2>
        <div className={styles.demo}>
          <div className={styles.rows} aria-busy="true" key={run}>
            {widths.map((w, i) => <Skeleton key={i} width={`${w}%`} delay={i * 0.05} />)}
          </div>
          <div style={{ marginTop: 16 }}><Button variant="ghost" size="micro" onClick={() => setRun(r => r + 1)}>Replay</Button></div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>The shape of what is coming</h2>
        <p className={styles.desc}>A table's rows, a card's title and text: the skeleton takes the shape of the content, so nothing moves when it lands.</p>
        <div className={styles.demo}>
          <div className={styles.rows} aria-busy="true">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={styles.tableRow}>
                <Skeleton delay={i * 0.08} />
                <Skeleton width={`${widths[i]}%`} delay={i * 0.08} />
                <Skeleton delay={i * 0.08} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>On a Base surface: level 3</h2>
        <p className={styles.desc}>On the page (lv0, lv1) it is lv2. On Base, which is lv2 itself, give it <code>level={'{3}'}</code> so it stays darker than what it sits on.</p>
        <Base>
          <div className={styles.rows} aria-busy="true">
            <Skeleton level={3} height={12} width="62%" />
            <Skeleton level={3} height={8} width="38%" delay={0.05} />
          </div>
        </Base>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A block</h2>
        <div className={styles.demo}>
          <Skeleton height={140} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'width', type: 'number | string', default: "'100%'", description: 'Any CSS length; a number is px.' },
          { name: 'height', type: 'number | string', default: '10', description: 'Any CSS length; a number is px. 10px is a line of small text.' },
          { name: 'level', type: '2 | 3', default: '2', description: 'The tone: 2 on the page, 3 on a Base surface.' },
          { name: 'delay', type: 'number', default: '0', description: 'Seconds to hold this one back, to stagger a column.' },
          { name: 'appear', type: 'boolean', default: 'true', description: 'Fade in after 0.15s. Off when a parent fades the whole group in.' },
        ]} />
        <p className={styles.desc} style={{ marginTop: 12 }}>It is decorative (aria-hidden): put <code>aria-busy="true"</code> on the region that is loading.</p>
      </div>
    </main>
  );
}
