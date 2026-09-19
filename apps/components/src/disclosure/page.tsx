import { useState } from 'react';
import { Disclosure, Table, TableRow, TableCell, Checkbox, Slider, Truncate } from '@indxsearch/systm';
import styles from './page.module.css';

const FIELDS = [
  { name: 'title', state: 'Searchable · Weight 3.0' },
  { name: 'authorName', state: 'Searchable · Filterable' },
  { name: 'cover.asset.metadata.dimensions.aspectRatio', state: 'Unused' },
];

export default function DisclosurePage() {
  const [weight, setWeight] = useState(1.5);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Disclosure</h1>
      <p className={styles.desc}>
        One row that opens to show more. Stack several for an accordion. The section is rendered only while
        open, so a long list of closed rows stays light.
      </p>

      <div className={styles.section}>
        <h2 className={styles.heading}>Basic</h2>
        <div style={{ maxWidth: 360 }}>
          <Disclosure summary="What is a dataset?">
            <p style={{ padding: '10px 15px', margin: 0, font: 'var(--text-sm)' }}>A dataset holds your JSON documents and their search index.</p>
          </Disclosure>
          <Disclosure summary="Open from the start" defaultOpen>
            <p style={{ padding: '10px 15px', margin: 0, font: 'var(--text-sm)' }}>Use <code>defaultOpen</code>, or control it with <code>open</code> and <code>onOpenChange</code>.</p>
          </Disclosure>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Settings per item, for a narrow screen</h2>
        <p className={styles.desc}>
          A wide settings table becomes a list of rows. Closed, a row says what is switched on. Open, it
          holds a small table with the label on the left and the control on the right.
        </p>
        <div style={{ maxWidth: 360 }}>
          {FIELDS.map(field => (
            <Disclosure key={field.name} summary={
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <Truncate side="start">{field.name}</Truncate>
                <span style={{ font: 'var(--text-xs)', color: 'var(--lv5)' }}>{field.state}</span>
              </span>
            }>
              <Table aria-label={`Settings for ${field.name}`}>
                <tbody>
                  <TableRow>
                    <TableCell label="Searchable"><Checkbox aria-label="Searchable" /></TableCell>
                    <TableCell label="Filterable"><Checkbox aria-label="Filterable" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell label="Weight" colSpan={2}>
                      <Slider min={0.5} max={3} step={0.25} value={weight} onChange={(v) => { if (typeof v === "number") setWeight(v); }} aria-label="Weight" />
                    </TableCell>
                  </TableRow>
                </tbody>
              </Table>
            </Disclosure>
          ))}
        </div>
      </div>
    </main>
  );
}
