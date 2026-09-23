import { useState } from 'react';
import { SaveBar, Button, InputField, ToggleSwitch } from '@indxsearch/systm';
import styles from './page.module.css';

export default function SaveBarPage() {
  const [name, setName] = useState('products');
  const [facets, setFacets] = useState(true);
  const [saved, setSaved] = useState({ name: 'products', facets: true });
  const dirty = name !== saved.name || facets !== saved.facets;

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SaveBar</h1>
        <p className={styles.desc}>
          The Save / Cancel row of a page that edits a working copy. It sits after the content it
          concludes and sticks to the bottom of the window while that content is taller than the
          screen, so the way out of an edit is always in reach.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Bound to a dirty flag</h2>
        <p className={styles.textRow}>
          Change a field and the bar appears. That is how a page says it needs Save: a page that
          saves at once, such as a member list, has no bar at all.
        </p>
        <div className={styles.demo}>
          <div className={styles.stack}>
            <InputField label="Dataset name" value={name} onChange={e => setName(e.target.value)} />
            <ToggleSwitch label="Return facets" checked={facets} onChange={setFacets} />
          </div>
          <SaveBar visible={dirty} message="Unsaved changes">
            <Button onClick={() => setSaved({ name, facets })}>Save</Button>
            <Button variant="secondary" onClick={() => { setName(saved.name); setFacets(saved.facets); }}>
              Cancel
            </Button>
          </SaveBar>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With secondary actions</h2>
        <p className={styles.textRow}>
          <code>aside</code> holds actions that belong to the whole list rather than to the edit:
          export, import, remove everything. They are ghost buttons at the end of the row.
        </p>
        <div className={styles.demo}>
          <SaveBar message="3 rules changed" aside={
            <>
              <Button variant="ghost" size="micro">Export</Button>
              <Button variant="ghost" size="micro">Import</Button>
            </>
          }>
            <Button>Save</Button>
            <Button variant="secondary">Cancel</Button>
          </SaveBar>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Usage</h2>
        <p className={styles.desc}>
          Primary first, then a secondary Cancel. Never Cancel first, and never ghost: the bar is
          the one place on the page where the primary action lives. Bind <code>visible</code> to the
          page's dirty flag rather than rendering it always and disabling Save, so an untouched page
          carries nothing. <code>message</code> takes a short status such as the number of changed
          rows. The region is labelled for screen readers, and <code>aria-label</code> overrides that
          label where "Unsaved changes" is not what the page is doing.
        </p>
      </div>
    </main>
  );
}
