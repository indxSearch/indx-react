import { useState } from 'react';
import { TagsInput } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

export default function TagsInputPage() {
  const [terms, setTerms] = useState(['sofa', 'couch', 'settee']);
  const [sites, setSites] = useState(['https://shop.example.com', '*.example.com']);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>TagsInput</h1>
        <p className={styles.desc}>
          A list of short values edited as chips in one field. A separator or Enter makes the text so far a chip, a
          paste with separators makes one per part, and leaving the field keeps what was typed. Backspace in the empty
          box takes the last chip back into it to be mended; each chip has its own remove step. A value already there,
          ignoring case, is not added twice.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Synonym terms</h2>
        <p className={styles.desc}>As the console's synonyms editor: only a semicolon and Enter divide, since a term may hold a comma or a space. Value: {terms.join(' · ') || 'none'}</p>
        <div style={{ maxWidth: 420 }}>
          <TagsInput
            label="Synonyms"
            value={terms}
            onChange={setTerms}
            separators=";"
            placeholder="Type a term, then Enter"
            hint="Enter or a semicolon ends a term; a comma or a space is part of it, so multi-word terms are fine."
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Websites</h2>
        <p className={styles.desc}>The default separators, a semicolon and a comma: paste "a.com, b.com" and it makes two.</p>
        <div style={{ maxWidth: 420 }}>
          <TagsInput label="Allowed websites" value={sites} onChange={setSites} placeholder="https://…" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'value', type: 'string[]', description: 'The values, in order.' },
          { name: 'onChange', type: '(value) => void', description: 'Called with the new list when a value is added, removed or taken back.' },
          { name: 'label', type: 'string', description: 'The label above the field.' },
          { name: 'placeholder', type: 'string', description: 'Shown while there are no values.' },
          { name: 'hint', type: 'string', description: 'A line under the field: what divides the values, what a value may hold.' },
          { name: 'separators', type: 'string', default: "';,'", description: 'The characters that end a value as it is typed or pasted, besides Enter.' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Shown, not editable.' },
        ]} />
      </div>
    </main>
  );
}
