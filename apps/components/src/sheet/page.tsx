import { useState } from 'react';
import { Button, Chip, InputField, Sheet } from '@indxsearch/systm';
import { Panel_add } from '@indxsearch/pixl';
import styles from './page.module.css';

const records = [
  { key: '25', name: 'Pikachu', type: 'electric', total: 320 },
  { key: '6', name: 'Charizard', type: 'fire', total: 534 },
  { key: '131', name: 'Lapras', type: 'water', total: 535 },
];

export default function SheetPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [left, setLeft] = useState(false);
  const rec = records.find(r => r.key === open);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Sheet</h1>
        <p className={styles.desc}>
          A panel the height of the window, over the page from its right edge or its left: a record opened from a list, a
          finding with its evidence, settings too long for a Modal. The list stays where it was beneath it. Escape, a press on
          the scrim or the close button closes it, the focus stays inside while it is open and goes back to what opened it.
          No motion: it is simply there, and then not.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>A record from a list</h2>
        <ul className={styles.list}>
          {records.map(r => (
            <li key={r.key}><Button variant="ghost" size="micro" onClick={() => setOpen(r.key)}>#{r.key} {r.name}</Button></li>
          ))}
        </ul>
        <Sheet open={open != null} onOpenChange={o => !o && setOpen(null)} title={rec?.name} description={rec ? `Record ${rec.key} in pokedex` : undefined}
               footer={<><Button variant="primary" size="micro">Save</Button><Button variant="secondary" size="micro" onClick={() => setOpen(null)}>Cancel</Button></>}>
          {rec && (
            <div className={styles.fields}>
              <InputField label="Name" value={rec.name} onChange={() => {}} />
              <div><Chip>{rec.type}</Chip> <span className={styles.muted}>Base total {rec.total}</span></div>
            </div>
          )}
        </Sheet>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>From the left, wide</h2>
        <Button variant="secondary" size="micro" iconLeft={<Panel_add />} onClick={() => setLeft(true)}>Open</Button>
        <Sheet open={left} onOpenChange={setLeft} side="left" size="wide" title="Settings" description="Too many for a Modal.">
          <p className={styles.muted}>A wide sheet is 720px, and the whole width on a phone.</p>
        </Sheet>
      </div>
    </main>
  );
}
