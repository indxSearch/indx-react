import { Truncate } from '@indxsearch/systm';
import styles from './page.module.css';

export default function TruncatePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Truncate</h1>
        <p className={styles.desc}>
          One line of text that ellipsizes instead of wrapping or overflowing. It shrinks inside a
          flex row or a grid column, which a bare span with text-overflow does not.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Which end gives way</h2>
        <div className={styles.demo}>
          <div className={styles.stack} style={{ maxWidth: 320 }}>
            <p className={styles.textRow}>end, the default: the tail is cut</p>
            <Truncate>Mega Fire Pig Pokémon with a very long classification that will not fit</Truncate>
            <p className={styles.textRow}>start: the beginning is cut, for text whose last part identifies it</p>
            <Truncate side="start">cover.asset.metadata.dimensions.height</Truncate>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a row that has to share the width</h2>
        <p className={styles.textRow}>
          The field name gives way while the chip beside it keeps its size.
        </p>
        <div className={styles.demo}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 260 }}>
            <Truncate>product.attributes.manufacturer.name</Truncate>
            <span className={styles.textRow} style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>String</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Usage</h2>
        <p className={styles.desc}>
          A plain string becomes its own tooltip, so the full text is a hover away. Pass
          <code>title</code> whenever the children are not a plain string, since the component
          cannot read the text out of them. Use <code>side="start"</code> for nested field names,
          file paths and URLs, where the end is what tells two of them apart.
        </p>
      </div>
    </main>
  );
}
