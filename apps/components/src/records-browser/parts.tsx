import { Button } from '@indxsearch/systm';
import { FIELDS, PAGE, isSearched, missing, nf, show, type FieldDef, type Rec, type Value } from './data';
import styles from './page.module.css';

/** "1 to 50 of 1,000" and the two steps. */
export function Pager({ page, listed, onPage }: { page: number; listed: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(listed / PAGE));
  if (listed === 0) return null;
  return (
    <div className={styles.pager}>
      <span className={styles.faint}>{nf.format(page * PAGE + 1)} to {nf.format(Math.min(listed, (page + 1) * PAGE))} of {nf.format(listed)}</span>
      <Button variant="ghost" size="micro" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
      <Button variant="ghost" size="micro" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

/** The cap, said where it bites: more match than are listed. */
export function CapNote({ count, listed, className }: { count: number; listed: number; className?: string }) {
  if (count <= listed) return null;
  return (
    <p className={className ?? styles.note}>
      {nf.format(count)} records match. The first {nf.format(listed)} are listed: narrow them with a filter, or change the order, to reach the others.
    </p>
  );
}

const roleTag: Record<string, string> = { filter: 'Filter', facet: 'Facet', sort: 'Sort' };

/** The record's fields as the field configuration groups them: what search reads, what filters
 *  and orders, and what is only stored. A missing searched field says what it costs. */
export function RecordFields({ rec, tagClass }: { rec: Rec; tagClass?: string }) {
  const groups: [string, string, FieldDef[]][] = [
    ['Searched', 'what a search reads', FIELDS.filter(isSearched)],
    ['Filter, facet and sort', '', FIELDS.filter(f => !isSearched(f) && f.roles.length > 0)],
    ['Stored only', 'returned, never searched', FIELDS.filter(f => f.roles.length === 0)],
  ];
  return (
    <>
      {rec.cut && <p className={styles.notice}>Its text is longer than the index takes: a search reads the first 100,000 characters. The record is stored whole.</p>}
      {groups.map(([title, note, fields]) => (
        <div key={title} className={styles.docSection}>
          <div className={styles.docSectionTitle}>{title}{note && <span className={styles.docSectionNote}>{note}</span>}</div>
          {fields.map(f => {
            const v = rec[f.name] as Value;
            return (
              <div key={f.name} className={styles.docField}>
                <div className={styles.docFieldHead}>
                  <span className={styles.docFieldName}>{f.name}</span>
                  {f.roles.filter(r => roleTag[r]).map(r => <span key={r} className={tagClass ?? styles.docTag}>{roleTag[r]}</span>)}
                </div>
                <div className={missing(v) ? styles.docEmpty : styles.docValue}>
                  {missing(v) ? (isSearched(f) ? `Missing: a search cannot find this record by its ${f.name}` : 'Missing') : clip(show(v), 400)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

/** The record as JSON, the way it is stored. */
export function RecordJson({ rec }: { rec: Rec }) {
  const { key: _key, cut: _cut, ...fields } = rec;
  const json = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined).map(([k, v]) => [k, typeof v === 'string' ? clip(v, 400) : v]));
  return <pre className={styles.json}>{JSON.stringify(json, null, 2)}</pre>;
}

export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
